import { getDefaultData, type WeddingData } from '@/hooks/useWeddingConfig'

let _weddingData: WeddingData = getDefaultData()
export function getWeddingData() { return _weddingData }
export function setWeddingData(data: WeddingData) { _weddingData = data }
