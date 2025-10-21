import React, {useEffect, useState} from "react"
function TimeDo(){

    const [sub, setSub] = useState([]);
    const [subInput, setSubInput] = useState([]);
    const [subColor, setSubColor] = useState('transparent')
    const [visibility, setVisibility] = useState(true);

    const newDate = new Date();
    const year = newDate.getFullYear();
    const month = newDate.getMonth() + 1; // month is 0 indexed? so need to add 1
    const day = newDate.getDate();
    const dateAdded = year +'/'+ month + '/' + day;
    const milsec = 86400000;
    
    useEffect(() => {
        fetch('http://localhost:3000/subdo')
        .then(res => res.json())
        .then(subData => setSub(subData))
        .catch(err => console.error(err))
    }, []);

    function addSub(){
        const dateAdditionString = prompt('Imput day for the sub');
        const dateAddition = Number(dateAdditionString)
        const testDate = Number(newDate);

        if(isNaN(dateAddition)) {
            alert("Must be a number");
            return;
        } else {
            const endDate = testDate + (milsec * dateAddition);
            const futureDate = new Date(endDate)
            const futureYear = futureDate.getFullYear();
            const futureMonth = futureDate.getMonth() + 1;
            const futureDay = futureDate.getDate();
            const subEnding = futureYear +'/'+ futureMonth + '/' + futureDay;
            console.log(subEnding)
        if(subInput.trim() !== ''){
            const newSub = {subText: subInput, color: subColor, visible: visibility, dateAdded: dateAdded, remaining: subEnding}
            fetch('http://localhost:3000/subdo', {
                method: 'POST',
                headers:{'Content-Type': 'application/json' },
                body: JSON.stringify(newSub)
            })
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json(); // parse only if status is 200/201
            })
            .then (subItem => {
                setSub(prev =>[...prev, {...subItem, dateAdded: dateAdded, remaining: subEnding}]);
                setSubInput('')
            })
            
        } else {
            alert('Nothing is written')
        }
        }
    }
    /*
    function subRemove(index){
        const subDelete = prompt("Enter 'DELETE' to delete Sub")
            if (subDelete === 'DELETE'){
                setSub(sub.filter((_, i) => i !== index))
                alert(sub[index].subText + " Was deleted")
            } else {
                alert("Task was not deleted")
           }
    }
    */
    function subRemove(index){
        const subDelete = prompt("Enter 'DELETE' to delete Sub");
        const subDel = sub[index];

        if(subDelete === 'DELETE') {
            fetch(`http://localhost:3000/subdo/${subDel.subId}`, {
                method: 'DELETE'
            })
            .then(response => {
                if(!response.ok) throw new Error(`HTTP Error! status ${response.status}`);
                setSub(sub.filter((_, i) => i !== index));
                alert(subDel.subText + " was deleted");
            })
            .catch(err => console.error('Error deleting the timed event:', err));
        } else {
            alert("Timed event was not deleted");
        }
    }

    function moveUp(index) {
        if(index ===0) return;
        const subUp = [...sub];
        [subUp[index], subUp[index - 1]] = [subUp[index-1], subUp[index]]
        setSub(subUp);
    }
    function moveDown(index) {
        if(index === (sub.length - 1)) return;
        const subDown = [...sub];
        [subDown[index], subDown[index + 1]] = [subDown[index + 1], subDown[index]]
        setSub(subDown)
    }
        function taskCompleted(index){
            const completed = [...sub];
            if(completed[index].subColor === '#70866a92'){
                subRemove(index);
            } else {
                completed[index].subColor
                setSubColor(completed);
            }
        }
        function hideList(){
            setVisibility(false)
        }
        function showList(){
            setVisibility(true)
        }

    return(
        <>
        <div className="listDiv">
            <div className="taskDiv">
                <input className="taskInput" type="text" placeholder="Input New Time" value={subInput} onChange={e => setSubInput(e.target.value)}/>
                <button className="listButton" onClick={addSub}>➕</button>
        </div>
        <h3 className="toDoHelement">
            Timed Events
            <button className="listButton" onClick={showList}>🔽</button><button onClick={hideList} className="listButton">🔼</button>
        </h3> 
        {visibility && (
            <ol className="toDoOl">
                {sub.map((sub, index) => 
                <li key={index} className="listItem" style={{ backgroundColor: sub.subColor }}>
                    {sub.subText + ': ' + sub.dateAdded + ' - ' + sub.remaining}
                    <br/>
                    <button className="listButton" onClick={()=> moveUp(index)}>☝️</button>
                    <button className="listButton" onClick={()=> moveDown(index)}>👇</button>
                    <button className="listButton" onClick={()=> taskCompleted(index)}>✔️</button>
                    <button className="listButton" onClick={()=> subRemove(index)}>❌</button>
                </li>)}
            </ol>)}
    </div>
        </>
    )
}

export default TimeDo