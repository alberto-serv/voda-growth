"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Navigation, Loader2, Clock } from "lucide-react"

interface AddressSuggestion {
  place_id: string
  description: string
  structured_formatting: {
    main_text: string
    secondary_text: string
  }
}

interface AddressAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (address: string) => void
  onInvalidAddress?: () => void
  placeholder?: string
  className?: string
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  onInvalidAddress,
  placeholder = "Enter your address",
  className = "",
}: AddressAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showNoResults, setShowNoResults] = useState(false)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false)
  const [previousAddresses, setPreviousAddresses] = useState<string[]>([])
  const debounceRef = useRef<NodeJS.Timeout>()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem("previousAddresses")
    if (stored) {
      try {
        setPreviousAddresses(JSON.parse(stored))
      } catch (error) {
        console.error("Error loading previous addresses:", error)
      }
    }
  }, [])

  const saveAddressToPrevious = (address: string) => {
    const updated = [address, ...previousAddresses.filter((addr) => addr !== address)].slice(0, 5) // Keep only 5 most recent
    setPreviousAddresses(updated)
    localStorage.setItem("previousAddresses", JSON.stringify(updated))
  }

  const mockSuggestions: AddressSuggestion[] = [
    {
      place_id: "1",
      description: "1600 Pennsylvania Avenue NW, Washington, DC 20500, USA",
      structured_formatting: {
        main_text: "1600 Pennsylvania Avenue NW",
        secondary_text: "Washington, DC 20500, USA",
      },
    },
    {
      place_id: "2",
      description: "2000 M Street NW, Washington, DC 20036, USA",
      structured_formatting: {
        main_text: "2000 M Street NW",
        secondary_text: "Washington, DC 20036, USA",
      },
    },
    {
      place_id: "3",
      description: "1500 K Street NW, Washington, DC 20005, USA",
      structured_formatting: {
        main_text: "1500 K Street NW",
        secondary_text: "Washington, DC 20005, USA",
      },
    },
    {
      place_id: "4",
      description: "3000 Connecticut Avenue NW, Washington, DC 20008, USA",
      structured_formatting: {
        main_text: "3000 Connecticut Avenue NW",
        secondary_text: "Washington, DC 20008, USA",
      },
    },
    {
      place_id: "5",
      description: "1200 Constitution Avenue NW, Washington, DC 20002, USA",
      structured_formatting: {
        main_text: "1200 Constitution Avenue NW",
        secondary_text: "Washington, DC 20002, USA",
      },
    },
  ]

  const fetchSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setShowNoResults(false)
      return
    }

    setIsLoading(true)
    setShowNoResults(false)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))

    // Filter mock suggestions based on query
    const filtered = mockSuggestions.filter((suggestion) =>
      suggestion.description.toLowerCase().includes(query.toLowerCase()),
    )

    setSuggestions(filtered)
    setIsOpen(true)

    if (filtered.length === 0 && query.length >= 3) {
      setShowNoResults(true)
    }
  }

  const handleInputChange = (newValue: string) => {
    onChange(newValue)
    setShowNoResults(false)

    if (newValue.length === 0 && previousAddresses.length > 0) {
      setIsOpen(true)
      setSuggestions([])
      return
    }

    // Clear existing debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue)
    }, 300)
  }

  const handleInputFocus = () => {
    if (value.length === 0 && previousAddresses.length > 0) {
      setIsOpen(true)
      setSuggestions([])
    }
  }

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    onChange(suggestion.description)
    onSelect(suggestion.description)
    saveAddressToPrevious(suggestion.description)
    setIsOpen(false)
    setSuggestions([])
    setShowNoResults(false)
  }

  const handlePreviousAddressClick = (address: string) => {
    onChange(address)
    onSelect(address)
    setIsOpen(false)
    setSuggestions([])
    setShowNoResults(false)
  }

  const handleManualEntry = () => {
    setIsOpen(false)
    setSuggestions([])
    setShowNoResults(false)
    onInvalidAddress?.()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false)
      setShowNoResults(false)
    }
  }

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setShowNoResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLocationFetch = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by this browser.")
      return
    }

    setIsFetchingLocation(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords

          // Simulate reverse geocoding API call
          await new Promise((resolve) => setTimeout(resolve, 1000))

          const mockAddress = `${Math.floor(Math.random() * 9999) + 1} ${
            ["Pennsylvania Avenue NW", "M Street NW", "K Street NW", "Connecticut Avenue NW", "Constitution Avenue NW"][
              Math.floor(Math.random() * 5)
            ]
          }, Washington, DC ${[20500, 20036, 20005, 20008, 20002][Math.floor(Math.random() * 5)]}, USA`

          onChange(mockAddress)
          onSelect(mockAddress)
          saveAddressToPrevious(mockAddress)
          setIsOpen(false)
          setSuggestions([])
          setShowNoResults(false)
        } catch (error) {
          console.error("Error fetching address:", error)
          alert("Unable to fetch your location. Please enter your address manually.")
        } finally {
          setIsFetchingLocation(false)
        }
      },
      (error) => {
        console.error("Geolocation error:", error)
        setIsFetchingLocation(false)

        let errorMessage = "Unable to get your location. "
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += "Please allow location access and try again."
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage += "Location information is unavailable."
            break
          case error.TIMEOUT:
            errorMessage += "Location request timed out."
            break
          default:
            errorMessage += "Please enter your address manually."
            break
        }
        alert(errorMessage)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      },
    )
  }

  return (
    <div className="relative" ref={inputRef}>
      <div className="relative">
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground">
          <Search className="h-5 w-5" />
        </div>
        <Input
          value={value}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`pl-12 pr-16 py-4 text-sm border-2 border-border hover:border-primary/50 focus:border-primary transition-colors ${className}`}
          autoComplete="off"
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLocationFetch}
          disabled={isFetchingLocation}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-primary/10"
          title="Use my current location"
        >
          {isFetchingLocation ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Navigation className="h-4 w-4 text-primary" />
          )}
        </Button>
      </div>

      {isOpen &&
        (suggestions.length > 0 ||
          isLoading ||
          showNoResults ||
          (value.length === 0 && previousAddresses.length > 0)) && (
          <div className="absolute z-50 w-full mt-2 bg-background border-2 border-border rounded-lg shadow-xl max-h-80 overflow-auto">
            {value.length === 0 && previousAddresses.length > 0 && !isLoading && (
              <>
                <div className="p-3 text-xs font-medium text-muted-foreground border-b border-border">
                  Previously entered addresses
                </div>
                {previousAddresses.map((address, index) => (
                  <div
                    key={index}
                    className="p-4 hover:bg-accent cursor-pointer border-b border-border last:border-b-0 transition-colors"
                    onClick={() => handlePreviousAddressClick(address)}
                  >
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm">{address}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            )}

            {isLoading ? (
              <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                Searching addresses...
              </div>
            ) : showNoResults ? (
              <div className="p-4">
                <div className="text-sm text-muted-foreground mb-3">No addresses found matching "{value}"</div>
                <button
                  onClick={handleManualEntry}
                  className="w-full text-left p-3 hover:bg-accent rounded-md border border-border transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <div>
                      <div className="font-medium text-sm">Enter address manually</div>
                      <div className="text-xs text-muted-foreground">Can't find your address? Enter it manually</div>
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <div
                  key={suggestion.place_id}
                  className="p-4 hover:bg-accent cursor-pointer border-b border-border last:border-b-0 transition-colors"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{suggestion.structured_formatting.main_text}</div>
                      <div className="text-xs text-muted-foreground">
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
    </div>
  )
}
