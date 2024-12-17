import { useEffect, useState, useRef } from "react"
import { View, Alert, Text } from "react-native"
import { IconLocationFilled } from "@tabler/icons-react-native"
import MapView, { Callout, Marker } from "react-native-maps"
import * as Location from "expo-location"
import { router } from "expo-router"

import { api } from "@/services/api"
import { colors, fontFamily } from "@/styles/theme"
import { Button } from "@/components/button"

import { Places } from "@/components/places"
import { PlaceProps } from "@/components/place"
import { Categories, CategoriesProps } from "@/components/categories"

type MarketsProps = PlaceProps & {
    latitude: number
    longitude: number
}

const currentLocation = {
    latitude: -23.561187293883442,
    longitude: -46.656451388116494,
}

export default function Home() {
    const [categories, setCategories] = useState<CategoriesProps>([])
    const [category, setCategory] = useState("")
    const [markets, setMarkets] = useState<MarketsProps[]>([])
    const mapRef = useRef<MapView>(null)

    async function fetchCategories() {
        try {
            const { data } = await api.get("/categories")
            setCategories(data)
            setCategory(data[0].id)
        } catch (error) {
            console.log(error)
            Alert.alert("Categorias", "Não foi possível carregar as categorias.")
        }
    }

    async function fetchMarkets() {
        try {
            if (!category) {
                return
            }

            const { data } = await api.get("/markets/category/" + category)
            setMarkets(data)
        } catch (error) {
            console.log(error)
            Alert.alert("Locais", "Não foi possível carregar os locais.")
        }
    }

    async function getCurrentLocation() {
        try {
            const { granted } = await Location.requestForegroundPermissionsAsync()

            if (granted) {
                const coords = await Location.getCurrentPositionAsync()
                console.log(coords)
            }
        } catch (error) {
            console.log(error)
        }
    }

    const goToCurrentLocation = () => {
        if (mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    ...currentLocation,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }, 1000 // Duração da animação em milissegundos
            )
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    useEffect(() => {
        fetchMarkets()
    }, [category])

    return (
        <View style={{ flex: 1, backgroundColor: "#CECECE" }}>
            <Categories
                data={categories}
                onSelect={setCategory}
                selected={category}
            />

            <MapView ref={mapRef} style={{ flex: 1}} initialRegion={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01, }} compassOffset={{x: 0, y: 50}}>
                <Marker identifier="current" coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude, }} image={require("@/assets/location.png")}/>
                {markets.map((item) => (
                    <Marker key={item.id} identifier={item.id} coordinate={{ latitude: item.latitude, longitude: item.longitude, }} image={require("@/assets/pin.png")}>
                        <Callout onPress={() => router.navigate(`/market/${item.id}`)}>
                            <View>
                                <Text style={{ fontSize: 14, color: colors.gray[600], fontFamily: fontFamily.medium, }}>{item.name}</Text>
                                
                                <Text style={{ fontSize: 12, color: colors.gray[600], fontFamily: fontFamily.regular, }}>{item.address}</Text>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
            <Button style={{ width: 40, height: 40, position: 'absolute', top: 165, right: 6, backgroundColor: colors.gray[100] }} onPress={goToCurrentLocation}>
                <Button.Icon icon={IconLocationFilled} />
            </Button>

            <Places data={markets} />
        </View>
    )
}