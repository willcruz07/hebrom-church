import { useCallback, useEffect, useState } from 'react'

import { deleteObject, getDownloadURL, uploadBytes, uploadBytesResumable } from 'firebase/storage'

import { storage, storageRef } from './config'

interface IStorageProps {
  fileBlob: Blob
  fileName: string
  userId: string
  fileCategory: string
}

interface IStorage {
  loading: boolean
  transferred: number
  url: string
  setStorage(data: IStorageProps): void
  error: string | null
  deleteStorage(path: string): Promise<void>
  uploadImage(file: File, path: string): Promise<string>
}

export const useFirebaseStorage = (): IStorage => {
  const [loading, setLoading] = useState<boolean>(false)
  const [transferred, setTransferred] = useState<number>(0)
  const [url, setUrl] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    setInitialState()
  }, [])

  const setInitialState = () => {
    setTransferred(0)
    setUrl('')
    setError(null)
  }

  const uploadImage = useCallback(async (file: File, path: string): Promise<string> => {
    try {
      const ref = storageRef(storage, path)
      const snapshot = await uploadBytesResumable(ref, file)
      const downloadURL = await getDownloadURL(snapshot.ref)
      return downloadURL
    } catch (error) {
      console.error('Error uploading image:', error)
      throw error
    }
  }, [])

  const setStorage = useCallback(({ userId, fileBlob, fileCategory, fileName }: IStorageProps) => {
    setInitialState()

    setLoading(true)

    const reference = storageRef(storage, `${userId}/${fileCategory}/${fileName}`)
    const uploadTask = uploadBytesResumable(reference, fileBlob)

    uploadTask.then(() => {
      getDownloadURL(reference)
        .then((url) => {
          setUrl(url)
          setLoading(false)
        })
        .catch(() => {
          setError('Não foi possível obter a URL do arquivo')
          setLoading(false)
        })
    })

    uploadTask.catch((error) => {
      setError(error.message)
      setLoading(false)
    })
  }, [])

  const deleteStorage = useCallback((path: string) => {
    const reference = storageRef(storage, path)
    return deleteObject(reference)
  }, [])

  return {
    loading,
    transferred,
    setStorage,
    url,
    error,
    deleteStorage,
    uploadImage,
  }
}
