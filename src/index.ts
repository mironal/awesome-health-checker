import APIError from "./error"
import { distanceInWordsToNow, differenceInMonths } from "date-fns"
import {
  publisher,
  GetTokenMessage,
  UpdateProgressMessage,
  ChangeIconVisibilityMessage,
  ContentMessages,
} from "./message"

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

const appendLoadingLabel = (elem: HTMLElement) => {
  const span = document.createElement("span")
  span.style.color = "gray"
  span.textContent = "[Loading...]"
  span.classList.add("__ahc_description_label__")
  elem.appendChild(span)
}

const updateHealthLabel = (span: HTMLSpanElement, info: RepositoryInfo) => {
  span.textContent = `[⭐ ${info.stargazers_count} 🕛 ${distanceInWordsToNow(
    info.lastCommit.toDateString(),
  )}]`

  // 1年前のは赤くして新しいほど緑になる
  const diff = differenceInMonths(new Date(), info.lastCommit)
  span.style.color = `rgb(${Math.min(100 * (diff - 1), 100) * 0.8}%, ${Math.min(
    100 * (12 - diff),
    100,
  ) * 0.8}%, ${0}%)`
}

const run = async () => {
  console.log("Awesome detected.")
  const accessToken = await getGithubToken()
  console.log("resolve access_token")
  const links = Array.from(document.querySelectorAll("#readme a")).filter(a => {
    if (a instanceof HTMLAnchorElement) {
      return (
        a.href.startsWith("https://github.com/") &&
        a.text &&
        !a.href.includes(location.pathname)
      )
    }
    return false
  }) as HTMLAnchorElement[]

  console.log(`There are ${links.length} awesome links.`)

  links.forEach(link => {
    const li = link.parentElement
    if (li) {
      appendLoadingLabel(li)
    }
  })

  let count = 0

  const remainingLinks = [...links]

  for (const link of links) {
    count++
    if (count > 5) {
      break
    }

    const msg: UpdateProgressMessage = {
      type: "update_progress",
      data: {
        current: count,
        max: 5,
      },
    }
    publisher.publishToBackground(msg)
    const repo = repoFromString(link.href)
    if (!repo) {
      continue
    }

    const info = await getRepository(accessToken, repo.owner, repo.repo)
    if (info) {
      const li = link.parentElement
      if (li) {
        const span = li.getElementsByClassName(
          "__ahc_description_label__",
        )[0] as HTMLSpanElement
        updateHealthLabel(span, info)
      }
    }
  }
}

interface RepositoryInfo {
  forks_count: number
  stargazers_count: number
  watchers_count: number
  lastCommit: Date
}
const getRepository = async (
  token: string,
  owner: string,
  repo: string,
): Promise<RepositoryInfo> => {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}`,
    {
      headers: { Authorization: `token ${token}` },
    },
  )

  if (response.status !== 200) {
    const error = new APIError(response, JSON.stringify(await response.json()))
    return Promise.reject(error)
  }

  const body = await response.json()

  const commitsResponse = await fetch(body.commits_url.replace("{/sha}", ""), {
    headers: { Authorization: `token ${token}` },
  })
  if (commitsResponse.status !== 200) {
    const error = new APIError(response, await commitsResponse.text())
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

const getGithubToken = async (): Promise<string> => {
  return new Promise((resolve, reject) => {
    const msg: GetTokenMessage = {
      type: "get_token",
    }
    publisher.publishToBackground(msg, response => {
      if (typeof response === "string") {
        resolve(response)
      } else {
        reject(response)
      }
    })
  })
}

if (location.pathname.toLowerCase().includes("awesome")) {
} else {
  const msg: ChangeIconVisibilityMessage = {
    type: "change_icon_visibility",
    data: {
      visible: false,
    },
  }
  publisher.publishToBackground(msg)
}

let canceled = false
const processMessage = (
  msg: ContentMessages,
  sender: chrome.runtime.MessageSender,
  responseFn: (response?: any) => void,
) => {
  if (msg.type === "start_check") {
    /*
    run().catch(error => {
      console.error(error)
      alert(error)
    })
    */
    responseFn()
  } else if (msg.type === "cancel_check") {
    canceled = true
    responseFn()
  }
}

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  console.log("onMessage", msg)
  processMessage(msg, sender, response)
})
