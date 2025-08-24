import { type NextRequest, NextResponse } from "next/server"

const NEWS_API_KEY = process.env.NEWS_API_KEY
const NEWS_API_BASE_URL = "https://newsapi.org/v2"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category") || "general"
  const searchQuery = searchParams.get("q")

  if (!NEWS_API_KEY) {
    return NextResponse.json(
      {
        error: "News API key not configured",
        message: "Please add a valid NEWS_API_KEY environment variable. Get your free API key from https://newsapi.org",
      },
      { status: 500 },
    )
  }

  try {
    let apiUrl: string

    if (searchQuery) {
      apiUrl = `${NEWS_API_BASE_URL}/everything?q=${encodeURIComponent(searchQuery)}&sortBy=publishedAt&language=en&apiKey=${NEWS_API_KEY}&pageSize=20`
    } else {
      apiUrl = `${NEWS_API_BASE_URL}/top-headlines?country=us&category=${category}&apiKey=${NEWS_API_KEY}&pageSize=20`
    }

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "NewsFlow/1.0",
      },
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: "Unknown API error" }))

      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "Invalid API key",
            message:
              "Your News API key is invalid. Please get a valid API key from https://newsapi.org and update your NEWS_API_KEY environment variable.",
            details: errorData,
          },
          { status: 401 },
        )
      }

      throw new Error(`News API error: ${response.status} - ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()

    const filteredArticles =
      data.articles?.filter(
        (article: any) =>
          article.title && article.description && article.title !== "[Removed]" && article.description !== "[Removed]",
      ) || []

    return NextResponse.json({
      articles: filteredArticles,
      totalResults: data.totalResults,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch news",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
