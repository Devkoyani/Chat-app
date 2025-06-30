import React, { useContext, useState } from 'react'
import assets from '../assets/assets'
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

const ProfilePage = () => {

    const {authUser, updateProfile} = useContext(AuthContext) 

    const [selectedImg, setSelectedImg] = useState(null)
    const [name, setName] = useState(authUser.fullName)
    const [bio, setBio] = useState(authUser.bio)
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(!selectedImg) {
            await updateProfile({fullName: name, bio});
            navigate('/')
            return;
        }

        const reader = new FileReader();
        reader.readAsDataURL(selectedImg);
        reader.onload = async () => {
            const base64Image = reader.result;
            await updateProfile({profilePic: base64Image, fullName: name, bio});
            navigate('/');
        }
    }

  return (
    <div className="min-h-screen bg-cover bg-no-repeat flex items-center justify-center p-4">
      <div className="w-full max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between flex-col sm:flex-row rounded-lg">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-6 sm:p-10 w-full"
        >
          <h3 className="text-lg font-medium">Profile details</h3>
          <label
            htmlFor="avatar"
            className="flex items-center gap-3 cursor-pointer text-sm sm:text-base"
          >
            <input
              onChange={(e) => setSelectedImg(e.target.files[0])}
              type="file"
              id="avatar"
              accept=".png, .jpg, .jpeg"
              hidden
            />
            <img
              src={
                selectedImg
                  ? URL.createObjectURL(selectedImg)
                  : assets.avatar_icon
              }
              alt=""
              className={`w-10 h-10 sm:w-12 sm:h-12 ${
                selectedImg && "rounded-full"
              }`}
            />
            Upload profile image
          </label>
          <input
            onChange={(e) => setName(e.target.value)}
            value={name}
            type="text"
            required
            placeholder="Your name"
            className="p-2 text-sm sm:text-base border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500  bg-transparent"
          />
          <textarea
            onChange={(e) => setBio(e.target.value)}
            value={bio}
            placeholder="Write profile bio"
            required
            className="p-2 text-sm sm:text-base border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500 bg-transparent"
            rows={4}
          ></textarea>

          <button
            type="submit"
            className="bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 text-sm sm:text-base rounded-full cursor-pointer hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </form>
        <div className="p-4 sm:p-6 flex justify-center w-full sm:w-auto">
          <img
            className={`w-32 h-32 sm:w-75 sm:h-45 rounded-full object-cover border-2 border-gray-600 ${
              selectedImg && "rounded-full"
            }`}
            src={authUser?.profilePic || assets.logo_icon}
            alt="Profile"
          />
        </div>
      </div>
    </div>
  );
}

export default ProfilePage
