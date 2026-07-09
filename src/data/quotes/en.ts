// src/data/quotes/en.ts
// Hand-curated 50 quotes for the landing page.
// Tag taxonomy: time-of-day + day-of-week + country + holiday + general.
// Designed so the selector always has a relevant quote to pick.

import type { Quote } from "../../types/quote";

export const QUOTES_EN: Quote[] = [
  // General — classics
  { id: "en-q1",  text: "Time is the most valuable thing a man can spend.", author: "Theophrastus", tags: ["general", "country:global"] },
  { id: "en-q2",  text: "Time flies like an arrow; fruit flies like a banana.", author: "Groucho Marx", tags: ["general", "country:us"] },
  { id: "en-q3",  text: "Lost time is never found again.", author: "Benjamin Franklin", tags: ["general", "country:us"] },
  { id: "en-q4",  text: "Time you enjoy wasting is not wasted time.", author: "Bertrand Russell", tags: ["general", "country:gb"] },
  { id: "en-q5",  text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy", tags: ["general", "country:ru"] },
  { id: "en-q6",  text: "How we spend our days is, of course, how we spend our lives.", author: "Annie Dillard", tags: ["general", "country:us"] },
  { id: "en-q7",  text: "It's not that we have a short time to live, but that we waste a lot of it.", author: "Seneca", tags: ["general", "country:it"] },
  { id: "en-q8",  text: "Time is what we want most, but what we use worst.", author: "William Penn", tags: ["general", "country:gb"] },
  { id: "en-q9",  text: "Better three hours too soon than a minute too late.", author: "William Shakespeare", tags: ["general", "country:gb"] },
  { id: "en-q10", text: "Punctuality is the virtue of the bored.", author: "Evelyn Waugh", tags: ["general", "afternoon"] },
  { id: "en-q11", text: "The key is in not spending time, but in investing it.", author: "Stephen R. Covey", tags: ["general", "country:us"] },
  { id: "en-q12", text: "Time is the wisest counselor of all.", author: "Pericles", tags: ["general", "country:global"] },
  { id: "en-q13", text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson", tags: ["general", "weekday"] },
  { id: "en-q14", text: "You may delay, but time will not.", author: "Benjamin Franklin", tags: ["general", "country:us"] },

  // Day of week
  { id: "en-q15", text: "This Monday, set the tone. The week is yours.", tags: ["monday", "morning"] },
  { id: "en-q16", text: "Tuesday — the day to turn intentions into motion.", tags: ["tuesday"] },
  { id: "en-q17", text: "Wednesday — the week's hinge point. Lean in.", tags: ["wednesday"] },
  { id: "en-q18", text: "Thursday: the home stretch begins.", tags: ["thursday", "afternoon"] },
  { id: "en-q19", text: "Friday: the universe's way of saying you've earned this.", tags: ["friday", "evening"] },
  { id: "en-q20", text: "Saturday is a gift. Spend it however the wind blows.", tags: ["saturday", "morning"] },
  { id: "en-q21", text: "Sunday — the pause that makes the week possible.", tags: ["sunday", "morning"] },

  // Time of day
  { id: "en-q22", text: "In the morning, the world is fresh. So are you.", tags: ["morning"] },
  { id: "en-q23", text: "Mornings are the universe's way of saying 'try again.'", tags: ["morning"] },
  { id: "en-q24", text: "An afternoon is a luxury the busy forget they have.", tags: ["afternoon"] },
  { id: "en-q25", text: "The afternoon is the only time of day where coffee and timeouts both apply.", tags: ["afternoon"] },
  { id: "en-q26", text: "Evenings are when the day's unfinished business comes back to visit.", tags: ["evening"] },
  { id: "en-q27", text: "There is something intimate about an evening that no morning can match.", tags: ["evening"] },
  { id: "en-q28", text: "The night is the hardest time to be alive, and 4am is the hardest hour.", author: "Charlie Parker", tags: ["night"] },
  { id: "en-q29", text: "Night sharpens, day softens.", tags: ["night"] },

  // Country-specific
  { id: "en-q30", text: "An inch of time is an inch of gold, but you can't buy an inch of time with an inch of gold.", author: "Chinese proverb", tags: ["general", "country:cn"] },
  { id: "en-q31", text: "Time flows in one direction. Enjoy each moment.", author: "Japanese proverb", tags: ["morning", "country:jp"] },
  { id: "en-q32", text: "On ne rattrape jamais le temps perdu.", author: "La Rochefoucauld", tags: ["general", "country:fr"] },
  { id: "en-q33", text: "Tomorrow is a new day with no mistakes in it yet.", author: "L. M. Montgomery", tags: ["morning", "country:ca"] },
  { id: "en-q34", text: "Time and tide wait for no man.", author: "Geoffrey Chaucer", tags: ["general", "country:gb"] },
  { id: "en-q35", text: "Carpe diem, quam minimum credula postero.", author: "Horace", tags: ["general", "country:it"] }, // seize the day
  { id: "en-q36", text: "El tiempo es oro.", tags: ["general", "country:mx"] }, // time is gold (Spanish)
  { id: "en-q37", text: "Who knows what the day will bring?", tags: ["morning", "country:au"] },
  { id: "en-q38", text: "Every day brings new choices.", tags: ["morning", "country:br"] },

  // Holidays / weekends
  { id: "en-q39", text: "Today is a good day to do nothing twice.", tags: ["holiday", "weekend"] },
  { id: "en-q40", text: "Holidays are proof that time can pause.", tags: ["holiday"] },
  { id: "en-q41", text: "A weekend well spent brings a week of content.", tags: ["weekend", "saturday"] },
  { id: "en-q42", text: "Sunday is the golden clasp that binds together the volume of the week.", author: "Henry Wadsworth Longfellow", tags: ["sunday", "weekend"] },
  { id: "en-q43", text: "Rest when you're weary. Refresh and renew yourself, then get back to work.", author: "Ralph Marston", tags: ["weekend", "saturday"] },
  { id: "en-q44", text: "Almost everything will work again if you unplug it for a few minutes — including you.", author: "Anne Lamott", tags: ["weekend", "sunday"] },

  // Friday / Sunday evening wind-down
  { id: "en-q45", text: "It's Friday. I'm in love with the future.", tags: ["friday", "evening"] },
  { id: "en-q46", text: "Sunday evenings are the universe's gentle reminder to slow down.", tags: ["sunday", "evening"] },

  // Light & wry
  { id: "en-q47", text: "Clocks slay time. Time is dead as long as it is being clicked off by little wheels; only when the clock stops does time come to life.", author: "William Faulkner", tags: ["general"] },
  { id: "en-q48", text: "Time is the most valuable thing on Earth, because it's the only thing you can't buy more of.", tags: ["general", "country:us"] },
  { id: "en-q49", text: "The future is something which everyone reaches at the rate of sixty minutes an hour.", author: "C. S. Lewis", tags: ["general", "weekday"] },
  { id: "en-q50", text: "Time is a great healer — but a poor beautician.", tags: ["general"] },
];

export default QUOTES_EN;