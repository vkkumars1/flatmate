"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Check, Filter, SlidersHorizontal } from "lucide-react"
import { getListings, type Listing } from "@/lib/listing-api"

const cities = ["All cities", "Gurugram", "Bangalore", "Pune", "Delhi", "Mumbai"]

export function ListingsPage() {
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [city, setCity] = useState("All cities")
  const [max, setMax] = useState(30000)
  const [verified, setVerified] = useState(false)
  const [cursor, setCursor] = useState<string>()
  const [hasMore, setHasMore] = useState(true)

  const load = async (nextCursor?: string) => {
    setLoading(true)
    const result = await getListings({ city, max, verified, cursor: nextCursor })
    setItems((current) => (nextCursor ? [...current, ...result.items] : result.items))
    setCursor(result.nextCursor)
    setHasMore(Boolean(result.nextCursor))
    setLoading(false)
  }

  useEffect(() => { void load() }, [city, max, verified])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    params.set("city", city)
    params.set("max", String(max))
    if (verified) params.set("verified", "true"); else params.delete("verified")
    window.history.replaceState(null, "", `/listings?${params.toString()}`)
  }, [city, max, verified])

  const skeletons = useMemo(() => Array.from({ length: 6 }, (_, index) => index), [])

  return <main className="min-h-screen bg-[#f7f3ed] px-4 pb-24 pt-8 text-[#0e1c18] sm:px-8 lg:px-12">
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div><p className="mb-2 text-xs font-black uppercase tracking-[0.22em] text-[#ff5c39]">THE FLAT MARKET</p><h1 className="font-serif text-5xl leading-none tracking-[-0.05em] sm:text-7xl">Find a place<br /><em className="font-normal">that fits.</em></h1></div>
        <Link href="/listings/new" className="inline-flex items-center gap-2 rounded-full bg-[#0e1c18] px-5 py-3 text-sm font-bold text-[#f7f3ed]">List your flat <ArrowRight size={16} /></Link>
      </header>
      <div className="sticky top-4 z-20 mb-10 rounded-[1.5rem] border-2 border-[#0e1c18] bg-[#e7dfd2] p-3 shadow-[5px_5px_0_#0e1c18]">
        <div className="flex flex-wrap items-center gap-3"><div className="flex items-center gap-2 text-sm font-black"><SlidersHorizontal size={17} /> Filter</div><select aria-label="City" value={city} onChange={(event) => setCity(event.target.value)} className="rounded-full border-2 border-[#0e1c18] bg-[#f7f3ed] px-4 py-2 text-sm font-bold outline-none"><option value="All cities">All cities</option>{cities.slice(1).map((item) => <option key={item}>{item}</option>)}</select><label className="flex min-w-52 flex-1 items-center gap-3 rounded-full border-2 border-[#0e1c18] bg-[#f7f3ed] px-4 py-2 text-sm font-bold">Rent up to ₹{max.toLocaleString("en-IN")}<input aria-label="Maximum rent" type="range" min="10000" max="40000" step="1000" value={max} onChange={(event) => setMax(Number(event.target.value))} className="w-full accent-[#ff5c39]" /></label><button type="button" onClick={() => setVerified((value) => !value)} className={`rounded-full border-2 border-[#0e1c18] px-4 py-2 text-sm font-black transition ${verified ? "bg-[#d7ff41]" : "bg-[#f7f3ed]"}`}><Check size={15} className="mr-1 inline" /> Verified only</button></div>
      </div>
      <div className="grid auto-rows-[12px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">{items.map((listing, index) => <motion.article key={listing.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} className={`group row-span-${index % 2 === 0 ? 34 : 30}`}><Link href={`/listings/${listing.id}`} className={`relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-[1.6rem] border-2 border-[#0e1c18] bg-white shadow-[4px_4px_0_#0e1c18] ${index % 3 === 1 ? "rotate-[1deg]" : "-rotate-[1deg]"}`}><img src={listing.photos[0]?.url} alt={listing.title} className="h-3/5 w-full object-cover transition duration-500 group-hover:scale-105" /><div className="flex flex-1 flex-col justify-between p-4"><div><div className="flex items-start justify-between gap-3"><h2 className="font-serif text-2xl leading-tight">{listing.title}</h2>{listing.verified && <span className="shrink-0 rounded-full bg-[#d7ff41] px-2 py-1 text-[10px] font-black uppercase">Verified</span>}</div><p className="mt-1 text-sm font-bold text-[#0e1c18]/60">{listing.locality}, {listing.city}</p></div><div className="mt-4 flex items-end justify-between"><p className="rounded-full bg-[#ff5c39] px-3 py-2 text-sm font-black text-[#fff7ee]">₹{listing.rent.toLocaleString("en-IN")} / month</p><span className="text-xs font-black uppercase tracking-widest">View flat →</span></div></div></Link></motion.article>)}{loading && skeletons.map((index) => <div key={`skeleton-${index}`} className="min-h-[360px] animate-pulse rounded-[1.6rem] border-2 border-[#0e1c18]/20 bg-[#e7dfd2]" />)}</div>
      {!loading && !items.length && <div className="py-20 text-center"><Filter className="mx-auto mb-4" /><p className="font-serif text-3xl">No flats fit those filters yet.</p></div>}
      {hasMore && !loading && <button type="button" onClick={() => void load(cursor)} className="mx-auto mt-12 flex rounded-full border-2 border-[#0e1c18] bg-[#d7ff41] px-6 py-3 font-black shadow-[4px_4px_0_#0e1c18]">Load more flats</button>}
    </div>
  </main>
}
