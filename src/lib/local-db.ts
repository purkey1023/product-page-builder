/**
 * IndexedDB 기반 로컬 저장소
 * localStorage 5MB 한도 대신 IndexedDB (수백 MB) 사용
 */
import type { Project } from '@/types'

const DB_NAME = 'ppb_database'
const DB_VERSION = 1
const PROJECTS_STORE = 'projects'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(PROJECTS_STORE)) {
        db.createObjectStore(PROJECTS_STORE, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readonly')
    const store = tx.objectStore(PROJECTS_STORE)
    const request = store.getAll()
    request.onsuccess = () => resolve(request.result ?? [])
    request.onerror = () => reject(request.error)
  })
}

export async function getProjectById(id: string): Promise<Project | null> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readonly')
    const store = tx.objectStore(PROJECTS_STORE)
    const request = store.get(id)
    request.onsuccess = () => resolve(request.result ?? null)
    request.onerror = () => reject(request.error)
  })
}

export async function putProject(project: Project): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readwrite')
    const store = tx.objectStore(PROJECTS_STORE)
    store.put(project)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteProjectById(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(PROJECTS_STORE, 'readwrite')
    const store = tx.objectStore(PROJECTS_STORE)
    store.delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}
