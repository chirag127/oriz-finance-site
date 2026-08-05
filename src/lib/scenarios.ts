/*
 * Saved calculator scenarios — Firestore, keyed by Clerk user id.
 *
 * Doc path: users/{clerkUserId}/financeScenarios/{scenarioId}
 * A scenario records which calculator (slug) + the input values so a
 * signed-in user can re-open a computation on any device. Anonymous
 * visitors never reach this — the whole calculator works without sign-in;
 * saving is the only gated feature.
 *
 * Firestore ONLY (no Firebase auth — Clerk owns identity). All calls run in
 * the browser inside a React island.
 */
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db } from './firebase'

export interface Scenario {
  id: string
  slug: string
  name: string
  inputs: Record<string, number | string>
  updatedAt?: number
}

function col(userId: string) {
  return collection(db, 'users', userId, 'financeScenarios')
}

export async function listScenarios(userId: string): Promise<Scenario[]> {
  const snap = await getDocs(query(col(userId), orderBy('updatedAt', 'desc')))
  return snap.docs.map((d) => {
    const data = d.data() as Omit<Scenario, 'id'> & { updatedAt?: { toMillis?: () => number } }
    return {
      id: d.id,
      slug: data.slug,
      name: data.name,
      inputs: data.inputs ?? {},
      updatedAt: data.updatedAt?.toMillis?.(),
    }
  })
}

export async function saveScenario(
  userId: string,
  slug: string,
  name: string,
  inputs: Record<string, number | string>,
): Promise<string> {
  const id = `${slug}-${Date.now().toString(36)}`
  await setDoc(doc(col(userId), id), { slug, name, inputs, updatedAt: serverTimestamp() })
  return id
}

export async function deleteScenario(userId: string, id: string): Promise<void> {
  await deleteDoc(doc(col(userId), id))
}
