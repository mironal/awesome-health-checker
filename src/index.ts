import APIError from "./error"
import { distanceInWordsToNow, differenceInMonths } from "date-fns"

const repoFromString = (url: string) => {
  const URL = new webkitURL(url)
  const matches = URL.pathname.match(/^\/([^\/]+)\/([^\/]+)\/?.*$/)
  if (matches && matches.length > 2) {
    return {
      owner: matches[1],
      repo: matches[2],
    }
  }
  return null
}

const run = () => {
  Promise.resolve(document)
    .then(
      dom =>
        Array.from(dom.querySelectorAll("#readme a")).filter(a => {
          if (a instanceof HTMLAnchorElement) {
            return (
              a.href.startsWith("https://github.com/") &&
              a.text &&
              !a.href.includes(location.pathname)
            )
          }
          return false
        }) as HTMLAnchorElement[],
    )
    .then(async links => {
      const results = []

      for (const link of links) {
        const repo = repoFromString(link.href)
        if (!repo) {
          continue
        }

        // TODO: rate limit 回避ためにログインの処理が必要
        const info = await getRepository(repo.owner, repo.repo).catch(error => {
          console.error(error)

          alert(error)
        })
        if (info) {
          const li = link.parentElement
          if (li) {
            const span = document.createElement("span")
            span.textContent = `[⭐ ${
              info.stargazers_count
            } 🕛 ${distanceInWordsToNow(info.lastCommit.toDateString())}]`

            const diff = differenceInMonths(new Date(), info.lastCommit)
            span.style.color = `rgb(${Math.min(100 * (diff - 1), 100) *
              0.8}%, ${Math.min(100 * (12 - diff), 100) * 0.8}%, ${0}%)`
            li.appendChild(span)
          }

          results.push({
            a: link,
            info,
          })
        } else {
          break
        }
      }

      return results
    })
    .catch(error => {
      console.error(error)
      alert(error)
    })
}

const getRepository = async (owner: string, repo: string) => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`)

  if (response.status !== 200) {
    const error = new APIError(response, JSON.stringify(await response.json()))
    return Promise.reject(error)
  }

  const body = await response.json()

  const commitsResponse = await fetch(body.commits_url.replace("{/sha}", ""))
  if (commitsResponse.status !== 200) {
    const error = new APIError(response, JSON.stringify(await response.json()))
    return Promise.reject(error)
  }
  const commitsBody = (await commitsResponse.json()) as any[]
  const lastCommit = new Date(Date.parse(commitsBody[0].commit.author.date))

  return {
    forks_count: body.forks_count,
    stargazers_count: body.stargazers_count,
    watchers_count: body.watchers_count,
    lastCommit,
  }
}

if (location.pathname.toLowerCase().includes("awesome")) {
  run()
}
