import React, {useEffect, useState} from "react";
//01655D

function ToDo(){
            const [taskColor, setColor] = useState("transparent");
            const [visibility, setVisibility] = useState(true);
            const [doTask, setTask] = useState([]); // array not a string
            const [taskInput, setTaskInput] = useState('');
            
            const taskDate = new Date();
            const taskYear = taskDate.getFullYear();
            const taskMonth = taskDate.getMonth() + 1;
            const taskDay = taskDate.getDate();
            const taskAdded = taskYear +'/'+ taskMonth + '/' + taskDay;

            useEffect(()=> {
                fetch('http://localhost:3000/todos')
                .then(res=>res.json())
                .then(data=>setTask(data))
                .catch(err => console.error(err))
            },[])

            function addTask(){       
                if(taskInput.trim() !== ""){
                    const newTaskObject = {text: taskInput, color: taskColor, visible: visibility, dateAdd: taskAdded}; 
                    fetch('http://localhost:3000/todos', {
                        method: 'POST',
                        headers: {'Content-Type': 'application/json' },
                        body: JSON.stringify(newTaskObject)
                    })
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                        return response.json(); // parse only if status is 200/201
                    })
                    .then(newItem => {
                        // append the frontend dateAdd instead of relying on the server
                    setTask(prev => [...prev, { ...newItem, dateAdd: taskAdded }])
                    setTaskInput('')
                    })
                } else {
                    alert('Nothing is written');
                }
            }
          
            function removeTask(index) {
                const taskToDelete = doTask[index];
                const confirmDelete = prompt("Enter 'DELETE' to delete task");

                if (confirmDelete === 'DELETE') {
                    fetch(`http://localhost:3000/todos/${taskToDelete.id}`, {
                        method: 'DELETE'
                    })
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                            setTask(doTask.filter((_, i) => i !== index));
                            alert(taskToDelete.text + " was deleted");
                    })
                    .catch(err => console.error('Error deleting task:', err));
                } else {
                    alert("Task was not deleted");
                }
            }

            function moveUp(index){
                if(index === 0) return;
                const moveTaskUp = [...doTask];
                [moveTaskUp[index], moveTaskUp[index - 1]] = [moveTaskUp[index - 1], moveTaskUp[index]];
                setTask(moveTaskUp)
            }

            function moveDown(index){
                if(index === (doTask.length - 1)) return;
                const moveTaskDown = [...doTask];
                [moveTaskDown[index + 1], moveTaskDown[index]] = [moveTaskDown[index], moveTaskDown[index + 1]];
                setTask(moveTaskDown)
            }
            function taskCompleted(index) {        
                const completeTask = [...doTask]; 
                 if (completeTask[index].color === '#70866a92') {
                    removeTask(index); 
                } else {
                    completeTask[index].color = '#70866a92'; 
                        setTask(completeTask);
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
                <input id="addTask" className="taskInput" type="text" placeholder="Input New Task" value={taskInput} onChange={e => setTaskInput(e.target.value)}/>
                <button onClick={addTask} className="listButton">➕</button>
        </div>
        <h3 className="toDoHelement">
            To Do Tasks <button className="listButton" onClick={showList}>🔽</button><button className="listButton" onClick={() => hideList()}>🔼</button>
        </h3>
        {visibility && (
            <ol className="toDoOl">
                {doTask.map((doTask, index) => 
                <li key={index}  className="listItem" style={{ backgroundColor: doTask.color }}>
                    {doTask.text + ': ' + doTask.dateAdd}
                    <br/>
                    <button className="listButton" onClick={() => moveUp(index)}>☝️</button>
                    <button className="listButton" onClick={() => moveDown(index)}>👇</button>
                    <button className="listButton" onClick={() => taskCompleted(index)}>✔️</button>
                    <button onClick={() => removeTask(index)} className="listButton">❌</button>
                </li>)}  
            </ol>
        )}
    </div>
        </>
    );   
}
export default ToDo