import './DropDown/list.css'; 
import ToDo from './DropDown/ToDo'
import TimeDo from './DropDown/TimeDo';

function MainNote(){
    return(
        <>
        <div className="mainNoteDiv">
            <h1>Reminder Notes</h1>
            <div className='bothLists'>
            <ToDo/>
            <TimeDo/>
            </div>
            <footer>
                <div className='footerInfo'>
                   <div className='creatorNote'>
                        <p><strong>Creator:</strong> <em>Me</em></p>
                    </div>
                    <div className='contactNote'>
                        <p><strong>Contact:</strong> </p>
                        <p>Discord - <em>magician4467</em></p>
                    </div> 
                </div>
                <div className='date'>
                   <p><strong>2025</strong></p> 
                </div>
            </footer>
        </div>
        </>
    )
}
export default MainNote