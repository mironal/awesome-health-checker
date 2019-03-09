import { APIError, TokenNotFoundError } from "./error"

import { distanceInWordsToNow, differenceInMonths } from "date-fns"
import {
  publisher,
  UpdateProgressMessage,
  ChangeIconVisibilityMessage,
  ContentMessages,
  FinishCheckMessage,
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

const updateHealthLabelString = (
  link: HTMLAnchorElement,
  text: string,
  color?: string,
) => {
  const li = link.parentElement
  if (!li) {
    return
  }

  let span = li.getElementsByClassName("__ahc_description_label__")[0]
  if (!span) {
    span = document.createElement("span")
    span.classList.add("__ahc_description_label__")
    li.appendChild(span)
  }
  if (span instanceof HTMLSpanElement) {
    span.textContent = text
    span.style.color = color || span.style.color
  }
}

const updateHealthLabel = (link: HTMLAnchorElement, info: RepositoryInfo) => {
  const text = `[⭐ ${info.stargazers_count} 🕛 ${distanceInWordsToNow(
    info.lastCommit.toDateString(),
  )}]`

  // 1年前のは赤くして新しいほど緑になる
  const diff = differenceInMonths(new Date(), info.lastCommit)
  const color = `rgb(${Math.min(100 * (diff - 1), 100) * 0.8}%, ${Math.min(
    100 * (12 - diff),
    100,
  ) * 0.8}%, ${0}%)`
  updateHealthLabelString(link, text, color)
}

const worker = async (links: HTMLAnchorElement[], accessToken: string) => {
  links.forEach(l => updateHealthLabelString(l, "[Loading...]"))

  const tasks = links.map(async link => {
    const repo = repoFromString(link.href)
    if (!repo) {
      return Promise.reject(new Error(`Invalid URL: ${link.href}`))
    }
    if (cancelled) {
      updateHealthLabelString(link, "[Cancelled]")
      return
    }

    const info = await getRepository(accessToken, repo.owner, repo.repo)
    if (info) {
      updateHealthLabel(link, info)
    }
  })

  return Promise.all(tasks)
}

const run = async () => {
  const accessToken = await getGithubToken()

  const links = Array.from(document.querySelectorAll("#readme a")).filter(a => {
    if (a instanceof HTMLAnchorElement) {
      return (
        a.href.startsWith("https://github.com/") &&
        a.text &&
        !a.href.includes(location.pathname) &&
        repoFromString(a.href)
      )
    }
    return false
  }) as HTMLAnchorElement[]

  links.forEach(link => updateHealthLabelString(link, "[Pending...]"))
  const size = 10
  const remainingLinks = [...links]
  while (remainingLinks.length > 0) {
    if (cancelled) {
      remainingLinks.forEach(link =>
        updateHealthLabelString(link, "[Cancelled]"),
      )
      break
    }
    const ls: HTMLAnchorElement[] = []
    for (var i = 0; i < size; i++) {
      const l = remainingLinks.shift()
      if (l) {
        ls.push(l)
      } else {
        break
      }
    }
    await worker(ls, accessToken)
    const msg: UpdateProgressMessage = {
      type: "update_progress",
      data: {
        remaining: remainingLinks.length,
        total: links.length,
      },
    }
    publisher.publishToBackground(msg)
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
    chrome.storage.sync.get(
      {
        github_access_token: "",
      },
      items => {
        const token = items.github_access_token
        if (token && token.length > 0) {
          resolve(token)
        } else {
          reject(new TokenNotFoundError())
        }
      },
    )
  })
}

if (!location.pathname.toLowerCase().includes("awesome")) {
  const msg: ChangeIconVisibilityMessage = {
    type: "change_icon_visibility",
    data: {
      visible: false,
    },
  }
  publisher.publishToBackground(msg)
}

const openOptionPage = () => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage()
  } else {
    const url = chrome.runtime.getURL("options.html")
    window.open(url)
  }
}

let cancelled = false
const processMessage = (
  msg: ContentMessages,
  sender: chrome.runtime.MessageSender,
  responseFn: (response?: any) => void,
) => {
  if (msg.type === "start_check") {
    cancelled = false
    run()
      .then(() => {
        const msg: FinishCheckMessage = {
          type: "finish_check",
        }
        publisher.publishToBackground(msg)
      })
      .catch(error => {
        const msg: FinishCheckMessage = {
          type: "finish_check",
        }
        publisher.publishToBackground(msg)
        console.error(error)
        if (error instanceof TokenNotFoundError) {
          if (confirm(error.message)) {
            openOptionPage()
          }
        } else {
          alert(error)
        }
      })
    responseFn()
  } else if (msg.type === "cancel_check") {
    cancelled = true
    responseFn()
  }
}

chrome.runtime.onMessage.addListener((msg, sender, response) => {
  processMessage(msg, sender, response)
})
