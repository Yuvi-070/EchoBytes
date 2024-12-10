import React from 'react'
import '../assets/css/card.css'
import musics from '../assets/data'
const Card = ({ props: { musicNumber, setMusicNumber } }) => {
    
    return (
        <div className="card">


            <div className="nav">
                <i className="material-icons">
                    expand_more
                </i>
                <span className="">Now playing {musicNumber +1 }/{musics.length}</span>
                <i className="material-icons">
                    queue_music
                </i>
            </div>
            <div className="img">
            <img src={musics[musicNumber].thumbnail} alt={musics[musicNumber].title} />
            </div>

            <div className='details'>
                <p className="title">{musics[musicNumber].title}</p>
                <p className="artist">{musics[musicNumber].artist}</p>
            </div>

            <div className="progress">
                <input type='range' min={0} max={100}></input>
            </div>

        <div className="timer">
            <span >00:00</span>
            <span >03:43</span>
        </div>

        <div className="controls">
                <i className="material-icons">
                    repeat
                </i>

                <i className="material-icons" id='prev'>
                    skip_previous
                </i>
                
                <div className="play">
                   <i className="material-icons" >play_arrow</i>
                </div>

                <i className="material-icons" id='next'>
                    skip_next
                </i>

            {/* VOLUMES */}
                <i className="material-icons" >
                   volume_up
                </i>
                <div className='volume '>    
                    <i className="material-icons">volume_up</i>
                    <input type='range' min={0} max={100}/> 
                    <span>50</span>
                </div>
                
                
        </div>
            <audio src={musics[musicNumber].src} hidden></audio>

        </div>
    )
}
export default Card