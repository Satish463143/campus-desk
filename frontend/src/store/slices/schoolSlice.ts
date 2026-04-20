// store/slices/schoolSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface AcademicYear {
  id: string
  name: string
  startDate: string
  endDate: string
  isActive: boolean
}

interface SchoolState {
  schoolId: string | null
  schoolName: string | null
  schoolLogo: string | null
  activeAcademicYear: AcademicYear | null
}

const initialState: SchoolState = {
  schoolId: null,
  schoolName: null,
  schoolLogo: null,
  activeAcademicYear: null,
}

const schoolSlice = createSlice({
  name: 'school',
  initialState,
  reducers: {
    setSchool: (state, action: PayloadAction<Omit<SchoolState, 'activeAcademicYear'>>) => {
      state.schoolId   = action.payload.schoolId
      state.schoolName = action.payload.schoolName
      state.schoolLogo = action.payload.schoolLogo
    },
    setActiveAcademicYear: (state, action: PayloadAction<AcademicYear>) => {
      state.activeAcademicYear = action.payload
    },
    clearSchool: (state) => {
      state.schoolId           = null
      state.schoolName         = null
      state.schoolLogo         = null
      state.activeAcademicYear = null
    },
  },
})

export const { setSchool, setActiveAcademicYear, clearSchool } = schoolSlice.actions
export default schoolSlice.reducer