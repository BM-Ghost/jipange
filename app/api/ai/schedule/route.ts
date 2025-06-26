import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { tasks, preferences, calendar } = await request.json()

    const systemPrompt = `You are an AI scheduling assistant that optimizes task scheduling based on:
    - Task priorities and deadlines
    - User energy levels and preferences
    - Existing calendar commitments
    - Task dependencies and estimated durations
    
    Provide optimal time slots and scheduling recommendations in JSON format.`

    const prompt = `
    Tasks to schedule: ${JSON.stringify(tasks)}
    User preferences: ${JSON.stringify(preferences)}
    Current calendar: ${JSON.stringify(calendar)}
    
    Please suggest optimal scheduling with time blocks, considering:
    1. High-priority tasks during peak energy hours
    2. Buffer time between meetings
    3. Task dependencies
    4. Deadline proximity
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: prompt,
    })

    return NextResponse.json({ schedule: text })
  } catch (error) {
    console.error("Schedule API Error:", error)
    return NextResponse.json({ error: "Failed to generate schedule" }, { status: 500 })
  }
}
