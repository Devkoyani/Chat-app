import React, { useContext, useEffect, useState } from 'react'
import assets  from '../assets/assets'
import { ChatContext } from '../../context/ChatContext';
import { AuthContext } from '../../context/AuthContext';

const RightSideBar = () => {

    const { selectedUser, messages } = useContext(ChatContext);
    const { logout, onlineUsers } = useContext(AuthContext);
    const [msgImages, setMsgImages] = useState([]);

    // Get all the images from the messages and set them to state
    useEffect(() => {
        setMsgImages(messages.filter(msg => msg?.image).map(msg => msg.image));
    }, [messages]);

  return selectedUser && (
    <div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? 'max-md:hidden' : ''}`}>

        <div className='pt-10 sm:pt-16 flex flex-col items-center gap-1 sm:gap-2 text-xs font-light mx-auto'>
            <img src={selectedUser?.profilePic || assets.avatar_icon} alt="" className='w-14 sm:w-20 aspect-[1/1] rounded-full'/>
            <h1 className='px-6 sm:px-10 text-sm sm:text-xl font-medium mx-auto flex items-center gap-1 sm:gap-2'>
                {onlineUsers.includes(selectedUser._id) && <p className='w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full'></p>}
                {selectedUser.fullName}
            </h1>
            <p className='px-6 sm:px-10 mx-auto text-xs sm:text-sm'>{selectedUser.bio}</p>
        </div>

        <hr className='border-[#ffffff50] my-3 sm:my-4'/>

        <div className='px-3 sm:px-5 text-xs'>
            <p>Media</p>
            <div className='mt-1 sm:mt-2 max-h-[150px] sm:max-h-[200px] overflow-y-scroll grid grid-cols-2 gap-2 sm:gap-4 opacity-80'>
                {msgImages.map((url, index) => (
                    <div key={index} onClick={() => window.open(url)} className='cursor-pointer rounded'>
                        <img src={url} alt="" className='h-full rounded-md'/>
                    </div>
                ))}
            </div>
        </div>

        <button onClick={() => logout()} className='absolute bottom-3 sm:bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-600 text-white border-none text-xs sm:text-sm font-light py-1.5 sm:py-2 px-12 sm:px-20 rounded-full cursor-pointer'>
            Logout
        </button>

    </div>
  )
}

export default RightSideBar
