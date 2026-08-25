export interface ParentFormData {
  name: string
  surname: string
  patronymic?: string
  phone: string
  email: string
}

export interface ChildFormData {
  name: string
  surname: string
  patronymic?: string
  age: number | undefined
  schoolGrade: number | undefined
  schoolName: string
}

export interface FamilyRegistrationAccount {
  role: 'PARENT' | 'STUDENT'
  label: string
  email: string
  password: string
}

export interface FamilyRegistrationResult {
  batchId: string
  accounts: FamilyRegistrationAccount[]
}

export function emptyParent(): ParentFormData {
  return { name: '', surname: '', patronymic: '', phone: '', email: '' }
}

export function emptyChild(): ChildFormData {
  return { name: '', surname: '', patronymic: '', age: undefined, schoolGrade: undefined, schoolName: '' }
}
