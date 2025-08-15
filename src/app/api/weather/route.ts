import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { city } = await req.json();
    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 });
    }
    const apiKey = process.env.OPENWEATHER_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Weather API key not set' }, { status: 500 });
    }
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: `Failed to fetch weather for ${city}` }, { status: res.status });
    }
    const data = await res.json();
    if (data.cod !== 200) {
      return NextResponse.json({ error: `Could not find weather for "${city}"` }, { status: 404 });
    }
    const description = data.weather?.[0]?.description ?? "unknown";
    const temp = data.main?.temp;
    return NextResponse.json({
      city,
      description,
      temp,
      message: `The weather in ${city} is ${description} with a temperature of ${temp}°C.`
    });
  } catch (err) {
    return NextResponse.json({ error: `Error fetching weather: ${err}` }, { status: 500 });
  }
}