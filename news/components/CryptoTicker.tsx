"use client"

import { useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface CryptoPrice {
  id: string
  symbol: string
  current_price: number
  price_change_percentage_24h: number
}

export default function CryptoTicker() {
  const [prices, setPrices] = useState<CryptoPrice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,dogecoin,shiba-inu,solana,cardano&vs_currencies=usd&include_24hr_change=true'
        )
        const data = await response.json()
        
        const formattedPrices = [
          { id: 'BTC', symbol: 'bitcoin', current_price: data.bitcoin.usd, price_change_percentage_24h: data.bitcoin.usd_24h_change },
          { id: 'ETH', symbol: 'ethereum', current_price: data.ethereum.usd, price_change_percentage_24h: data.ethereum.usd_24h_change },
          { id: 'XRP', symbol: 'ripple', current_price: data.ripple.usd, price_change_percentage_24h: data.ripple.usd_24h_change },
          { id: 'DOGE', symbol: 'dogecoin', current_price: data.dogecoin.usd, price_change_percentage_24h: data.dogecoin.usd_24h_change },
          { id: 'SHIB', symbol: 'shiba-inu', current_price: data['shiba-inu'].usd, price_change_percentage_24h: data['shiba-inu'].usd_24h_change },
          { id: 'SOL', symbol: 'solana', current_price: data.solana.usd, price_change_percentage_24h: data.solana.usd_24h_change },
          { id: 'ADA', symbol: 'cardano', current_price: data.cardano.usd, price_change_percentage_24h: data.cardano.usd_24h_change },
        ]
        
        setPrices(formattedPrices)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching prices:', error)
        setLoading(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number) => {
    if (price < 0.01) return price.toFixed(8)
    if (price < 1) return price.toFixed(4)
    if (price < 100) return price.toFixed(2)
    return price.toFixed(2)
  }

  if (loading) {
    return (
      <div className="w-full  bg-gray-900/60 backdrop-blur-xl rounded-xl p-3">
        <div className="animate-pulse flex space-x-4 overflow-x-auto">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="space-y-2 flex-shrink-0">
              <div className="h-3 w-12 bg-gray-700 rounded"></div>
              <div className="h-3 w-20 bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-900/60 backdrop-blur-xl rounded-xl overflow-hidden">
      <div className="flex animate-scroll-right py-3">
        {[...prices, ...prices].map((crypto, index) => (
          <div
            key={`${crypto.id}-${index}`}
            className="flex items-center space-x-2 px-4 whitespace-nowrap flex-shrink-0"
          >
            <span className="font-medium text-sm text-gray-200">{crypto.id}</span>
            <span className="text-sm text-gray-100">
              ${formatPrice(crypto.current_price)}
            </span>
            <div
              className={`flex items-center text-sm ${
                crypto.price_change_percentage_24h >= 0
                  ? 'text-green-500'
                  : 'text-red-500'
              }`}
            >
              {crypto.price_change_percentage_24h >= 0 ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              <span className="ml-0.5">
                {Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
