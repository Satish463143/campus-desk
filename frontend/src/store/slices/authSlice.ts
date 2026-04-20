import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

export const getLoggedInUser = createAsyncThunk(
    "User/getLoggedInUserRedux",
    async(_, { rejectWithValue })=>{
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('_at')}`,
                },
            });
            if (!response.ok) throw new Error("Failed to fetch user data");
            const data = await response.json();
            return data.result; // Assuming the structure matches your API response
        } catch (exception: any) {
            console.error(exception);
            return rejectWithValue(exception.message);
        }
    }
)

const UserSlicer = createSlice({
    name:'User',
    initialState:{
        loggedInUser:null,
    },
    reducers:{
        setLoggedInUser:(state,action)=>{
            state.loggedInUser = action.payload
        },
        logoutUser: (state) => {
            state.loggedInUser = null;
            // Clear tokens from localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem('_at');
                localStorage.removeItem('_rt');
            }
        }
    },
    extraReducers:(builder)=>{
        builder.addCase(getLoggedInUser.fulfilled,(state,action)=>{
            state.loggedInUser = action.payload
        })
        builder.addCase(getLoggedInUser.rejected,(state)=>{
            state.loggedInUser = null
        })
    }
})

export const {setLoggedInUser, logoutUser} = UserSlicer.actions;

export default UserSlicer.reducer;