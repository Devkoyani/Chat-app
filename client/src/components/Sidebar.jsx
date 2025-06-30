import React, { useContext, useEffect, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../../context/AuthContext'
import { ChatContext } from '../../context/ChatContext'

const Sidebar = () => {

    const {getUsers, users, selectedUser, setSelectedUser, unseenMessages, setUnseenMessages} = useContext(ChatContext);

    const {logout, onlineUsers} = useContext(AuthContext);

    const [input, setInput] = useState(false); 

    const navigate = useNavigate();

    const filteredUsers = input ? users.filter((user) => user.fullName.toLowerCase().includes(input.toLowerCase())) : users;

    useEffect(() => {
      getUsers();
    }, [onlineUsers]);

  return (
    <div className={`bg-[#8185B2]/10 h-full p-3 sm:p-5 rounded-r-xl overflow-y-scroll text-white ${selectedUser ? 'max-md:hidden' : ''}`}>
        <div className='pb-5 sm:pb-5'>
            <div className='flex justify-between items-center'>
                <img src={assets.logo} alt="logo" className='w-28 sm:max-w-40'/>
                <div className='relative py-2 group'>
                    <img src={assets.menu_icon} alt="Menu" className='max-h-5 cursor-pointer'/>
                    <div className='absolute top-full right-0 z-20 w-32 p-3 sm:p-5 rounded-md bg-[#282142] border border-gray-600  text-gray-100 hidden group-hover:block'>
                        <p onClick={() => navigate('/profile')} className='cursor-pointer text-xs sm:text-sm'>Edit Profile</p>
                        <hr className='my-2 border-t border-gray-500'/>
                        <p onClick={() => logout()} className='cursor-pointer text-xs sm:text-sm'>Logout</p>
                    </div>
                </div>
            </div>

            <div className='bg-[#282142] rounded-full flex items-center gap-2 py-2 sm:py-3 px-3 sm:px-4 mt-3 sm:mt-5'>
                <img src={assets.search_icon} alt="Search" className='w-3' />
                <input onChange={(e) => setInput(e.target.value)} type="text" className='bg-transparent border-none outline-none text-white text-xs placeholder-[#c8c8c8] flex-1' placeholder='Search User...'/>
            </div>  

        </div>

        <div className='flex flex-col'>
            {filteredUsers.map((user, index) => (
                <div key={index} onClick={() => {setSelectedUser(user); setUnseenMessages(prev=>({...prev, [user._id]:0}))}} className={`relative flex items-center gap-2 p-2 pl-3 sm:pl-4 rounded cursor-pointer text-xs sm:text-sm ${selectedUser?._id === user._id && 'bg-[#282142]/50'}`}>
                    <img src={user?.profilePic || assets.avatar_icon} alt="" className='w-7 sm:w-[35px] aspect-[1/1] rounded-full'/>
                    <div className='flex flex-col leading-4 sm:leading-5'>
                        <p>{user?.fullName}</p>
                        {
                            onlineUsers.includes(user._id)
                            ? <span className='text-green-400 text-[10px] sm:text-xs'>Online</span>
                            : <span className='text-neutral-400 text-[10px] sm:text-xs'>Offline</span>
                        }
                    </div>
                    {unseenMessages[user._id] > 0 && <p className='absolute top-3 sm:top-4 right-3 sm:right-4 text-[10px] sm:text-xs h-4 w-4 sm:h-5 sm:w-5 flex justify-center items-center rounded-full bg-violet-500/50'>{unseenMessages[user._id]}</p>}
                </div>
            ) )}
              
        </div>

    </div>
  )
}

export default Sidebar
