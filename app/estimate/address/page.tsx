"use client"

import { useState } from "react"
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { MapPin, ArrowRight, ArrowLeft, Loader2, Phone, Clock, MapPinned, Home, Layers, Maximize, Pencil, BedDouble, Bath } from 'lucide-react'

interface AddressData {
  searchQuery: string
  homeSize?: number
  stories?: number
  bedrooms?: number // Added bedrooms
  bathrooms?: number
  fullAddress?: string
  // Manual entry fields
  address?: string
  city?: string
  zipcode?: string
  state?: string
}

export default function AddressPage() {
  const router = useRouter()
  const [addressData, setAddressData] = useState<AddressData>({
    searchQuery: "",
  })
  const [isValidating, setIsValidating] = useState(false)
  const [isValidated, setIsValidated] = useState(false)
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [manualEntryStep, setManualEntryStep] = useState<"address" | "property">("address")
  const [isRetrievingMLS, setIsRetrievingMLS] = useState(false)

  const [editingField, setEditingField] = useState<string | null>(null)
  const [tempValues, setTempValues] = useState<{
    homeSize?: number
    stories?: number
    bedrooms?: number // Added bedrooms
    bathrooms?: number
  }>({})

  const handleAddressSelect = (address: string) => {
    setAddressData({ ...addressData, searchQuery: address })
    validateAddress(address)
  }

  const handleInvalidAddress = () => {
    setShowManualEntry(true)
    setManualEntryStep("address")
  }

  const validateAddress = async (address?: string) => {
    const addressToValidate = address || addressData.searchQuery
    if (!addressToValidate.trim()) {
      return
    }

    setIsValidating(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const mockHomeSize = Math.floor(Math.random() * 2000) + 1200 // 1200-3200 sq ft
      const mockStories = Math.floor(Math.random() * 2) + 1 // 1-2 stories
      const mockBedrooms = Math.floor(Math.random() * 4) + 2 // 2-5 bedrooms
      const mockBathrooms = Math.floor(Math.random() * 3) + 1 // 1-3 bathrooms

      const updatedData = {
        ...addressData,
        searchQuery: addressToValidate,
        homeSize: mockHomeSize,
        stories: mockStories,
        bedrooms: mockBedrooms,
        bathrooms: mockBathrooms,
        fullAddress: addressToValidate,
        state: "DC", // Updated state to DC for Washington, D.C.
      }

      setAddressData(updatedData)
      setIsValidated(true)

      localStorage.setItem("estimateData", JSON.stringify({ address: updatedData }))
    } catch (error) {
      console.error("Address validation failed:", error)
    } finally {
      setIsValidating(false)
    }
  }

  const handleManualAddressSubmit = async () => {
    if (!addressData.address || !addressData.city || !addressData.zipcode) {
      return
    }

    setIsRetrievingMLS(true)

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))

      const mockHomeSize = Math.floor(Math.random() * 2000) + 1200
      const mockStories = Math.floor(Math.random() * 2) + 1
      const mockBedrooms = Math.floor(Math.random() * 4) + 2
      const mockBathrooms = Math.floor(Math.random() * 3) + 1

      const updatedData = {
        ...addressData,
        homeSize: mockHomeSize,
        stories: mockStories,
        bedrooms: mockBedrooms,
        bathrooms: mockBathrooms,
        state: "DC", // Updated state to DC
      }

      setAddressData(updatedData)
      setManualEntryStep("property")
    } catch (error) {
      console.error("MLS data retrieval failed:", error)
    } finally {
      setIsRetrievingMLS(false)
    }
  }

  const handleManualSubmit = () => {
    if (
      !addressData.address ||
      !addressData.city ||
      !addressData.zipcode ||
      !addressData.homeSize ||
      !addressData.stories
    ) {
      return
    }

    const manualAddress = `${addressData.address}, ${addressData.city}, ${addressData.zipcode}`
    const updatedData = {
      ...addressData,
      fullAddress: manualAddress,
      searchQuery: manualAddress,
      state: "DC", // Updated state to DC
    }

    setAddressData(updatedData)
    setIsValidated(true)

    localStorage.setItem("estimateData", JSON.stringify({ address: updatedData }))

    router.push("/estimate/services")
  }

  const handleEditField = (field: string) => {
    setEditingField(field)
    setTempValues({
      homeSize: addressData.homeSize,
      stories: addressData.stories,
      bedrooms: addressData.bedrooms, // Added bedrooms
      bathrooms: addressData.bathrooms,
    })
  }

  const handleSaveField = (field: string) => {
    const updatedData = {
      ...addressData,
      ...tempValues,
    }
    setAddressData(updatedData)
    localStorage.setItem("estimateData", JSON.stringify({ address: updatedData }))
    setEditingField(null)
  }

  const handleCancelEdit = () => {
    setEditingField(null)
    setTempValues({})
  }

  const handleNext = () => {
    if (isValidated) {
      router.push("/estimate/services")
    }
  }

  const isManualAddressValid = addressData.address && addressData.city && addressData.zipcode
  const isManualFormValid = isManualAddressValid && addressData.homeSize && addressData.stories

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: 'url(/home-background.jpeg)' }}
      >
        <div className="absolute inset-0 bg-white/15" />
      </div>

      <Header />

      <div className="flex-grow container mx-auto px-4 py-16 pt-32">
        <div className="max-w-2xl mx-auto min-h-[60vh] flex flex-col justify-center">
          <div className="mb-12 text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-foreground">Get an Estimate</h1>
            <p className="text-sm text-muted-foreground/80 mb-4">Step 1 of 4: Service Location </p>
            <Progress value={25} className="w-full md:w-64 mx-auto mb-2 h-1 [&>div]:bg-primary" />
          </div>

          <div className="bg-white/75 backdrop-blur-md rounded-lg shadow-xl p-8 md:p-10 space-y-6">
            {!showManualEntry ? (
              <>
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold mb-3 text-foreground">Enter your address  </h2>
                  <p className="text-base md:text-lg text-muted-foreground">
                    Enter your address so we can confirm we service your area and provide you with the best cleaning
                    experience.
                  </p>
                </div>

                <div className="space-y-4">
                  <AddressAutocomplete
                    value={addressData.searchQuery}
                    onChange={(value) => setAddressData({ ...addressData, searchQuery: value })}
                    onSelect={handleAddressSelect}
                    onInvalidAddress={handleInvalidAddress}
                    placeholder="Enter your address (e.g., 1600 Pennsylvania Ave NW, Washington, DC)"
                    className="bg-white border-2 border-gray-400"
                  />

                  <Button
                    onClick={() => validateAddress()}
                    disabled={!addressData.searchQuery.trim() || isValidating}
                    className="w-full bg-primary hover:bg-secondary text-primary-foreground"
                    variant={isValidated ? "secondary" : "default"}
                    size="lg"
                  >
                    <MapPin className="mr-2 h-4 w-4" />
                    {isValidating
                      ? "Verifying Location..."
                      : isValidated
                        ? "Location Verified ✓"
                        : "Verify My Location"}
                  </Button>
                </div>

                {isValidated && (
                  <div className="pt-4 border-t">
                    <Button
                      onClick={() => {
                        const updatedData = {
                          ...addressData,
                          fullAddress: addressData.fullAddress || addressData.searchQuery,
                        }
                        localStorage.setItem("estimateData", JSON.stringify({ address: updatedData }))
                        router.push("/estimate/services")
                      }}
                      size="lg"
                      className="w-full bg-primary hover:bg-secondary text-primary-foreground"
                    >
                      Continue to Service Selection
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-foreground">
                    <MapPin className="h-5 w-5 text-primary" />
                    {manualEntryStep === "address" ? "Enter Address Manually" : "Property Details"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {manualEntryStep === "address" ? (
                    <>
                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label htmlFor="address">Street Address</Label>
                          <Input
                            id="address"
                            placeholder="123 Main Street"
                            value={addressData.address || ""}
                            onChange={(e) => setAddressData({ ...addressData, address: e.target.value })}
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city">City</Label>
                            <Input
                              id="city"
                              placeholder="City"
                              value={addressData.city || ""}
                              onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                            />
                          </div>
                          <div>
                            <Label htmlFor="zipcode">ZIP Code</Label>
                            <Input
                              id="zipcode"
                              placeholder="12345"
                              value={addressData.zipcode || ""}
                              onChange={(e) => setAddressData({ ...addressData, zipcode: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button variant="outline" onClick={() => setShowManualEntry(false)} className="flex-1">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Search
                        </Button>
                        <Button
                          onClick={handleManualAddressSubmit}
                          disabled={!isManualAddressValid || isRetrievingMLS}
                          className="flex-1 bg-primary hover:bg-secondary text-primary-foreground"
                        >
                          {isRetrievingMLS ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Retrieving Property Data...
                            </>
                          ) : (
                            <>
                              <MapPin className="mr-2 h-4 w-4" />
                              Use This Address
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">
                          <strong>Address:</strong> {addressData.address}, {addressData.city}, {addressData.zipcode}
                        </p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="homeSize" className="text-sm font-semibold">
                            Home Size (sq ft)
                          </Label>
                          <Input
                            id="homeSize"
                            type="number"
                            placeholder="2000"
                            value={addressData.homeSize || ""}
                            onChange={(e) =>
                              setAddressData({ ...addressData, homeSize: Number.parseInt(e.target.value) || undefined })
                            }
                            className="text-base font-semibold h-10 text-center border-2 focus:border-primary"
                          />
                        </div>
                        <div>
                          <Label htmlFor="stories" className="text-sm font-semibold">
                            Stories
                          </Label>
                          <Input
                            id="stories"
                            type="number"
                            placeholder="2"
                            min="1"
                            max="5"
                            value={addressData.stories || ""}
                            onChange={(e) =>
                              setAddressData({ ...addressData, stories: Number.parseInt(e.target.value) || undefined })
                            }
                            className="text-base font-semibold h-10 text-center border-2 focus:border-primary"
                          />
                        </div>
                        {/* Added Bedrooms input */}
                        <div>
                          <Label htmlFor="bedrooms" className="text-sm font-semibold">
                            Bedrooms
                          </Label>
                          <Input
                            id="bedrooms"
                            type="number"
                            placeholder="3"
                            min="1"
                            max="10"
                            value={addressData.bedrooms || ""}
                            onChange={(e) =>
                              setAddressData({
                                ...addressData,
                                bedrooms: Number.parseInt(e.target.value) || undefined,
                              })
                            }
                            className="text-base font-semibold h-10 text-center border-2 focus:border-primary"
                          />
                        </div>
                        <div>
                          <Label htmlFor="bathrooms" className="text-sm font-semibold">
                            Bathrooms
                          </Label>
                          <Input
                            id="bathrooms"
                            type="number"
                            placeholder="3"
                            min="1"
                            max="10"
                            value={addressData.bathrooms || ""}
                            onChange={(e) =>
                              setAddressData({
                                ...addressData,
                                bathrooms: Number.parseInt(e.target.value) || undefined,
                              })
                            }
                            className="text-base font-semibold h-10 text-center border-2 focus:border-primary"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-4">
                        <Button variant="outline" onClick={() => setManualEntryStep("address")} className="flex-1">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Address
                        </Button>
                        <Button
                          onClick={handleManualSubmit}
                          disabled={!isManualFormValid}
                          className="flex-1 bg-primary hover:bg-secondary text-primary-foreground"
                        >
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Continue
                        </Button>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {!showManualEntry && (
              <div className="space-y-4 mt-6">
                {isValidated ? (
                  <>
                    <Card className="border-2 border-primary/20 overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative">
                          <img
                            src={`/placeholder.svg?height=400&width=800&query=aerial satellite view of residential property in washington dc neighborhood with houses and streets`}
                            alt="Satellite Map View"
                            className="w-full h-64 md:h-80 object-cover"
                          />
                          <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg border border-primary/20">
                            <div className="flex items-center gap-2">
                              <MapPinned className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-xs text-muted-foreground">Location Verified</p>
                                <p className="text-sm font-bold text-foreground">
                                  {addressData.fullAddress || addressData.searchQuery}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                            Satellite View
                          </div>
                        </div>
                        <div className="p-4 bg-primary">
                          <p className="text-sm text-primary-foreground text-center">
                            We've located your property and retrieved the details below
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Property Details Card */}
                    <Card className="border-2 border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg md:text-xl text-foreground">
                          <Home className="h-6 w-6 text-primary" />
                          Property Details
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Home Size */}
                          <div className="bg-[#E8E9EC] rounded-lg p-4 relative group">
                            {editingField === "homeSize" ? (
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  value={tempValues.homeSize || ""}
                                  onChange={(e) =>
                                    setTempValues({
                                      ...tempValues,
                                      homeSize: Number.parseInt(e.target.value) || undefined,
                                    })
                                  }
                                  className="h-8 text-center"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveField("homeSize")}
                                    className="flex-1 h-7 text-xs bg-primary hover:bg-secondary text-primary-foreground"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="flex-1 h-7 text-xs bg-transparent"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditField("homeSize")}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded"
                                >
                                  <Pencil className="h-3 w-3 text-[#152644]" />
                                </button>
                                <div className="flex items-center gap-2 mb-1">
                                  <Maximize className="h-4 w-4 text-primary" />
                                  <p className="text-xs font-medium text-muted-foreground">Home Size</p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">
                                  {addressData.homeSize?.toLocaleString()}
                                </p>
                                <p className="text-xs text-muted-foreground">sq ft</p>
                              </>
                            )}
                          </div>

                          {/* Stories */}
                          <div className="bg-[#E8E9EC] rounded-lg p-4 relative group">
                            {editingField === "stories" ? (
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  min="1"
                                  max="5"
                                  value={tempValues.stories || ""}
                                  onChange={(e) =>
                                    setTempValues({
                                      ...tempValues,
                                      stories: Number.parseInt(e.target.value) || undefined,
                                    })
                                  }
                                  className="h-8 text-center"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveField("stories")}
                                    className="flex-1 h-7 text-xs bg-primary hover:bg-secondary text-primary-foreground"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="flex-1 h-7 text-xs bg-transparent"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditField("stories")}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded"
                                >
                                  <Pencil className="h-3 w-3 text-[#152644]" />
                                </button>
                                <div className="flex items-center gap-2 mb-1">
                                  <Layers className="h-4 w-4 text-primary" />
                                  <p className="text-xs font-medium text-muted-foreground">Stories</p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">{addressData.stories}</p>
                                <p className="text-xs text-muted-foreground">floors</p>
                              </>
                            )}
                          </div>

                          {/* Bedrooms */}
                          <div className="bg-[#E8E9EC] rounded-lg p-4 relative group">
                            {editingField === "bedrooms" ? (
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={tempValues.bedrooms || ""}
                                  onChange={(e) =>
                                    setTempValues({
                                      ...tempValues,
                                      bedrooms: Number.parseInt(e.target.value) || undefined,
                                    })
                                  }
                                  className="h-8 text-center"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveField("bedrooms")}
                                    className="flex-1 h-7 text-xs bg-primary hover:bg-secondary text-primary-foreground"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="flex-1 h-7 text-xs bg-transparent"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditField("bedrooms")}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded"
                                >
                                  <Pencil className="h-3 w-3 text-[#152644]" />
                                </button>
                                <div className="flex items-center gap-2 mb-1">
                                  <BedDouble className="h-4 w-4 text-primary" />
                                  <p className="text-xs font-medium text-muted-foreground">Bedrooms</p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">{addressData.bedrooms}</p>
                                <p className="text-xs text-muted-foreground">beds</p>
                              </>
                            )}
                          </div>

                          {/* Bathrooms */}
                          <div className="bg-[#E8E9EC] rounded-lg p-4 relative group">
                            {editingField === "bathrooms" ? (
                              <div className="space-y-2">
                                <Input
                                  type="number"
                                  min="1"
                                  max="10"
                                  value={tempValues.bathrooms || ""}
                                  onChange={(e) =>
                                    setTempValues({
                                      ...tempValues,
                                      bathrooms: Number.parseInt(e.target.value) || undefined,
                                    })
                                  }
                                  className="h-8 text-center"
                                  autoFocus
                                />
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveField("bathrooms")}
                                    className="flex-1 h-7 text-xs bg-primary hover:bg-secondary text-primary-foreground"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEdit}
                                    className="flex-1 h-7 text-xs bg-transparent"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditField("bathrooms")}
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/50 rounded"
                                >
                                  <Pencil className="h-3 w-3 text-[#152644]" />
                                </button>
                                <div className="flex items-center gap-2 mb-1">
                                  <Bath className="h-4 w-4 text-primary" />
                                  <p className="text-xs font-medium text-muted-foreground">Bathrooms</p>
                                </div>
                                <p className="text-2xl font-bold text-foreground">{addressData.bathrooms}</p>
                                <p className="text-xs text-muted-foreground">baths</p>
                              </>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-4">
                          Hover over any field to edit the property details
                        </p>
                      </CardContent>
                    </Card>
                  </>
                ) : null}
              </div>
            )}
          </div>

        </div>
      </div>

      <Footer />
    </div>
  )
}
