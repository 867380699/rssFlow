
export type Header = {
  id: number
  level: number
  text: string
  scrollIntoView?: () => void
}

export interface ContentContext {
  registerHeader: (header: Omit<Header, 'id'>) => number
}

export const useProvideContentContext = () => {
  const regId = ref(0)
  const headers = ref<Header[]>([])

  const registerHeader = (header: Omit<Header, 'id'>) => {
    const id = regId.value++
    headers.value.push({...header, id})
    return id 
  }

  provide('contentContext', {
    registerHeader
  })

  return {
    headers
  }
}

export const useInjectContentContext = () => {
  const contentContext = inject<ContentContext>('contentContext')
  return {contentContext}
}