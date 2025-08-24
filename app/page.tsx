"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { ExternalLink, Clock, Settings, AlertCircle, Search, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"

interface NewsArticle {
  title: string
  description: string
  url: string
  urlToImage: string
  publishedAt: string
  source: {
    name: string
  }
}

const NEWS_DOMAINS = [
  { value: "general", label: "Home Feed" }, // renamed General News to Home Feed
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business" },
  { value: "health", label: "Health" },
  { value: "science", label: "Science" },
  { value: "sports", label: "Sports" },
  { value: "entertainment", label: "Entertainment" },
]

const AVAILABLE_TOPICS = [
  "artificial intelligence",
  "climate change",
  "cryptocurrency",
  "space exploration",
  "renewable energy",
  "cybersecurity",
  "electric vehicles",
  "machine learning",
  "biotechnology",
  "quantum computing",
  "social media",
  "gaming",
  "startups",
  "stock market",
  "real estate",
]

const STORAGE_KEY = "newsflow-preferences"

export default function NewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDomain, setSelectedDomain] = useState("general")
  const [error, setError] = useState<string | null>(null)
  const [isApiKeyError, setIsApiKeyError] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearchMode, setIsSearchMode] = useState(false)
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [isCustomFeed, setIsCustomFeed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  const loadUserPreferences = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const preferences = JSON.parse(stored)
        return {
          selectedDomain: preferences.selectedDomain || "general",
          selectedTopics: preferences.selectedTopics || [],
          isCustomFeed: preferences.isCustomFeed || false,
        }
      }
    } catch (error) {
      console.error("Error loading user preferences:", error)
    }
    return {
      selectedDomain: "general",
      selectedTopics: [],
      isCustomFeed: false,
    }
  }

  const saveUserPreferences = (domain: string, topics: string[], customFeed: boolean) => {
    try {
      const preferences = {
        selectedDomain: domain,
        selectedTopics: topics,
        isCustomFeed: customFeed,
        lastUpdated: new Date().toISOString(),
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch (error) {
      console.error("Error saving user preferences:", error)
    }
  }

  useEffect(() => {
    const preferences = loadUserPreferences()
    setSelectedDomain(preferences.selectedDomain)
    setSelectedTopics(preferences.selectedTopics)
    setIsCustomFeed(preferences.isCustomFeed)
  }, [])

  const fetchNews = async (category: string, query?: string, customTopics?: string[]) => {
    setLoading(true)
    setError(null)
    setIsApiKeyError(false)

    try {
      let url = `/api/news?category=${category}`
      if (query) {
        url += `&q=${encodeURIComponent(query)}`
      } else if (customTopics && customTopics.length > 0) {
        url += `&q=${encodeURIComponent(customTopics.join(" OR "))}`
      }

      const response = await fetch(url)

      if (!response.ok) {
        const errorData = await response.json()

        if (response.status === 401 || errorData.error?.includes("API key") || errorData.message?.includes("API key")) {
          setIsApiKeyError(true)
          setError(errorData.message || "Invalid News API key. Please check your API key configuration.")
        } else {
          throw new Error(errorData.details || errorData.error || "Failed to fetch news")
        }
        return
      }

      const data = await response.json()
      setArticles(data.articles || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load news. Please try again later."
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    setIsSearchMode(true)
    fetchNews(selectedDomain, searchQuery)
  }

  useEffect(() => {
    if (!isSearchMode) {
      if (selectedDomain === "general" && isCustomFeed && selectedTopics.length > 0) {
        fetchNews(selectedDomain, undefined, selectedTopics)
      } else {
        fetchNews(selectedDomain)
      }
    }
  }, [selectedDomain, isSearchMode, isCustomFeed, selectedTopics])

  const handleDomainChange = (domain: string) => {
    setSelectedDomain(domain)
    saveUserPreferences(domain, selectedTopics, isCustomFeed)
    if (isSearchMode) {
      setIsSearchMode(false)
      setSearchQuery("")
    }
  }

  const handleTopicToggle = (topic: string) => {
    const updatedTopics = selectedTopics.includes(topic)
      ? selectedTopics.filter((t) => t !== topic)
      : [...selectedTopics, topic]

    setSelectedTopics(updatedTopics)
    saveUserPreferences(selectedDomain, updatedTopics, isCustomFeed)
  }

  const handleCustomFeedToggle = (enabled: boolean) => {
    setIsCustomFeed(enabled)
    saveUserPreferences(selectedDomain, selectedTopics, enabled)
  }

  const clearSearch = () => {
    setSearchQuery("")
    setIsSearchMode(false)
    if (selectedDomain === "general" && isCustomFeed && selectedTopics.length > 0) {
      fetchNews(selectedDomain, undefined, selectedTopics)
    } else {
      fetchNews(selectedDomain)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="min-h-screen bg-background newspaper-grid">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-center flex-1">
              <h1 className="newspaper-header text-5xl font-bold text-foreground mb-2 tracking-tight">NewsFlow</h1>
              <div className="newspaper-divider w-32 mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground uppercase tracking-widest">
                {selectedDomain === "general" && isCustomFeed && selectedTopics.length > 0
                  ? `Custom Edition • ${selectedTopics.slice(0, 2).join(" • ")}${selectedTopics.length > 2 ? " • More" : ""}`
                  : "Daily Edition • Personalized News"}
              </p>
            </div>

            <div className="flex items-center gap-3 absolute right-4 top-6">
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-2 text-muted-foreground hover:text-foreground">
                    <Settings className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Feed Settings</DialogTitle>
                    <DialogDescription>
                      Customize your news feed by selecting topics you're interested in.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox id="custom-feed" checked={isCustomFeed} onCheckedChange={handleCustomFeedToggle} />
                      <label
                        htmlFor="custom-feed"
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        Enable custom home feed
                      </label>
                    </div>

                    {isCustomFeed && selectedDomain !== "general" && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          Custom topics only apply to the Home Feed. Switch to Home Feed to see your personalized
                          content.
                        </p>
                      </div>
                    )}

                    {isCustomFeed && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">Select topics for your Home Feed:</h4>
                        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                          {AVAILABLE_TOPICS.map((topic) => (
                            <div key={topic} className="flex items-center space-x-2">
                              <Checkbox
                                id={topic}
                                checked={selectedTopics.includes(topic)}
                                onCheckedChange={() => handleTopicToggle(topic)}
                              />
                              <label
                                htmlFor={topic}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                              >
                                {topic}
                              </label>
                            </div>
                          ))}
                        </div>
                        {selectedTopics.length === 0 && (
                          <p className="text-xs text-muted-foreground">
                            Select at least one topic to enable custom feed.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Select value={selectedDomain} onValueChange={handleDomainChange}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {NEWS_DOMAINS.map((domain) => (
                    <SelectItem key={domain.value} value={domain.value}>
                      {domain.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for news topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="submit" disabled={!searchQuery.trim()}>
              Search
            </Button>
            {isSearchMode && (
              <Button type="button" variant="outline" onClick={clearSearch}>
                Clear
              </Button>
            )}
          </form>

          {isSearchMode && (
            <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Search className="h-4 w-4" />
              <span>Searching for: "{searchQuery}"</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5 max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-destructive font-medium mb-2">{error}</p>
                  {isApiKeyError && (
                    <div className="text-sm text-muted-foreground space-y-2">
                      <p>To fix this issue:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-4">
                        <li>
                          Visit{" "}
                          <a
                            href="https://newsapi.org"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                          >
                            newsapi.org
                          </a>{" "}
                          to get a free API key
                        </li>
                        <li>Copy your API key</li>
                        <li>
                          Add it to your project's environment variables as{" "}
                          <code className="bg-muted px-1 py-0.5 rounded text-xs">NEWS_API_KEY</code>
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              </div>
              {!isApiKeyError && (
                <Button onClick={() => fetchNews(selectedDomain)} className="mt-4 mx-auto block" variant="outline">
                  Try Again
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <Card key={i} className="h-fit">
                <CardHeader className="pb-3">
                  <Skeleton className="h-6 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-3" />
                  <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Skeleton className="h-20 w-full mb-3 rounded" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-3" />
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.length === 0 ? (
              <div className="col-span-full">
                <Card className="max-w-2xl mx-auto">
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">
                      {isSearchMode
                        ? `No articles found for "${searchQuery}". Try a different search term.`
                        : "No articles found for this category."}
                    </p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              articles.map((article, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-lg transition-all duration-300 h-fit border-2 hover:border-accent/20"
                >
                  <CardHeader className="pb-3">
                    <h2 className="newspaper-header text-lg font-bold leading-tight mb-3 group-hover:text-accent transition-colors line-clamp-3">
                      {article.title}
                    </h2>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {article.source.name}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(article.publishedAt)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {article.urlToImage && (
                      <img
                        src={article.urlToImage || "/placeholder.svg"}
                        alt=""
                        className="w-full h-32 object-cover rounded border mb-3"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />
                    )}
                    <p className="newspaper-body text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-3">
                      {article.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full group-hover:bg-accent group-hover:text-accent-foreground transition-colors bg-transparent"
                      onClick={() => window.open(article.url, "_blank")}
                    >
                      Read Article
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}
