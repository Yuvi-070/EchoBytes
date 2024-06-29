import React from 'react'
import '../assets/css/card.css'
// import data from '../assets/data/index'
import musics from '../assets/data'
const Card = ({ props: { musicNumber, setMusicNumber } }) => {
    // console.log(data)
    return (
        <div className="card">
            <div className="nav">
                <i className="material-icons">
                    expand_more
                </i>
                <span className="">Now playing {musicNumber +1 }/{musics.length}</span>
            </div>
        </div>
    )
}
export default Card