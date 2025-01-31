class Todo {
    constructor(task, category, date, status = 'todo') {
        this.task = task;
        this.category = category;
        this.date = date;
        this.status = status;
    }

    static changeTodoStatus(draggedItem, newStatus) {
        const todos = LocalStore.getTodos();
        const taskText = draggedItem.children[0].innerText.trim();

        const todo = todos.find(todo => todo.task === taskText);
        if (todo) {
            todo.status = newStatus;

            localStorage.setItem('todos', JSON.stringify(todos));

            const ui = new UI();
            ui.updateTaskPosition(draggedItem, newStatus);
            Stats.updateStats(); 
        }
    }
}

class UI {
    addTaskToUi(todo) {
        const todoList = document.querySelector('#todo-list');
        const inprogressList = document.querySelector('#inprogress-list');
        const doneList = document.querySelector('#done-list');

        const todoDiv = document.createElement('div');
        todoDiv.className = 'todo-div ' + todo.category;

        todoDiv.innerHTML = `
            <div class="title">
                <p>${todo.task}</p>
                <button class="delete-btn" title="Delete Task"><i class="fa fa-trash"></i></button>
            </div>
            <hr>
            <div class="details">
                <p class="category">${todo.category}</p>
                <p class="todo-date"><i class="fa fa-calendar"></i> ${todo.date}</p>
                <select class="status-select">
                    <option value="todo" ${todo.status === "todo" ? "selected" : ""}>To Do</option>
                    <option value="inprogress" ${todo.status === "inprogress" ? "selected" : ""}>In Progress</option>
                    <option value="done" ${todo.status === "done" ? "selected" : ""}>Completed</option>
                </select>
            </div>
        `;

        const statusSelect = todoDiv.querySelector('.status-select');
        statusSelect.addEventListener('change', (e) => {
            const newStatus = e.target.value;
            Todo.changeTodoStatus(todoDiv, newStatus); 
        });

        this.updateTaskPosition(todoDiv, todo.status);

        const deleteBtn = todoDiv.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.preventDefault();
            UI.deleteTodo(todoDiv);
        });

        const activeNav = document.querySelector('.nav-active').getAttribute('data-value');
        todoDiv.style.display = (todoDiv.classList.contains(activeNav) || activeNav === 'alltasks') ? 'flex' : 'none';
    }

    updateTaskPosition(todoDiv, newStatus) {
        const lists = {
            'todo': document.querySelector('#todo-list'),
            'inprogress': document.querySelector('#inprogress-list'),
            'done': document.querySelector('#done-list')
        };

        Object.values(lists).forEach(list => {
            if (list.contains(todoDiv)) list.removeChild(todoDiv);
        });

        lists[newStatus]?.prepend(todoDiv);
    }

    static deleteTodo(todoDiv) {
        todoDiv.remove();  
        LocalStore.deleteFromLocal(todoDiv);  
        Stats.updateStats();  
    }

    static search(query) {
        const todoDivs = document.querySelectorAll('.todo-div');
        todoDivs.forEach(todoDiv => {
            const taskText = todoDiv.querySelector('.title p').innerText.toLowerCase();
            if (taskText.includes(query.toLowerCase())) {
                todoDiv.style.display = 'flex';
            } else {
                todoDiv.style.display = 'none';
            }
        });
    }

    showAlert(message, icon, className) {
        const alertMsgDiv = document.createElement('div');
        alertMsgDiv.className = 'alert-msg ' + className;
        alertMsgDiv.innerHTML = `<p><i class="fa ${icon}"></i> ${message}</p>`;
        document.querySelector('.header').appendChild(alertMsgDiv);
        setTimeout(() => alertMsgDiv.remove(), 3000);
    }

    filterCategories(e) {
        const selectedCategory = e.target.getAttribute('data-value');
        const todoDivs = document.querySelectorAll('.todo-div');

        todoDivs.forEach(todoDiv => {
            if (selectedCategory === 'alltasks' || todoDiv.classList.contains(selectedCategory)) {
                todoDiv.style.display = 'flex';
            } else {
                todoDiv.style.display = 'none';
            }
        });
    }

    activeNav(target) {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('nav-active'));
        target.classList.add('nav-active');
    }
}

class LocalStore {
    static getTodos() {
        return JSON.parse(localStorage.getItem('todos')) || [];
    }

    static displayTodo() {
        const todos = LocalStore.getTodos();
        const ui = new UI();
        todos.forEach(todo => ui.addTaskToUi(todo));
        Stats.updateStats(); 
    }

    static addTodo(todo) {
        const todos = LocalStore.getTodos();
        todos.push(todo);
        localStorage.setItem('todos', JSON.stringify(todos));
        Stats.updateStats();  
    }

    static deleteFromLocal(todoDiv) {
        const todos = LocalStore.getTodos();
        const taskText = todoDiv.querySelector('.title p').innerText.trim();
        const updatedTodos = todos.filter(todo => todo.task !== taskText);
        localStorage.setItem('todos', JSON.stringify(updatedTodos));
        Stats.updateStats();  
    }
}

class Stats {
    static updateStats() {
        const todos = LocalStore.getTodos();
        const stats = {
            allTasks: todos.length,
            completedTasks: todos.filter(todo => todo.status === 'done').length,
            inprogressTasks: todos.filter(todo => todo.status === 'inprogress').length,
            todoTasks: todos.filter(todo => todo.status === 'todo').length
        };

        document.querySelectorAll('.all-tasks').forEach(task => task.innerText = stats.allTasks);
        document.querySelectorAll('.completed-tasks').forEach(task => task.innerText = stats.completedTasks);
        document.querySelectorAll('.inprogres-tasks').forEach(task => task.innerText = stats.inprogressTasks);
        document.querySelectorAll('.pending-tasks').forEach(task => task.innerText = stats.todoTasks);

        const progressDone = stats.allTasks > 0 ? (100 * stats.completedTasks / stats.allTasks) : 0;
        const progress = document.querySelector('.progress-done');
        progress.style.width = progressDone + '%';
        progress.style.opacity = stats.allTasks > 0 ? 1 : 0;

        const progressBar = document.querySelector('.progress-done-num');
        progressBar.innerText = `${stats.completedTasks}/${stats.allTasks}`;
    }
}

document.querySelector('.create-todo-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const taskInput = document.querySelector('.todo-input');
    const categoryInput = document.querySelector('.todo-category');
    const dateInput = document.querySelector('.todo-date');

    const task = taskInput.value.trim();
    const category = categoryInput.value;
    const date = dateInput.value;

    const ui = new UI();

    if (task === '' || category === '' || date === '') {
        ui.showAlert("Fill in all the details", 'fa-exclamation-triangle', 'error-msg');
    } else {
        const todo = new Todo(task, category, date);
        ui.addTaskToUi(todo);
        LocalStore.addTodo(todo);
        ui.showAlert('Task added successfully', 'fa-check-circle', 'success-msg');

        taskInput.value = '';
        categoryInput.selectedIndex = 0; 
        dateInput.value = '';   
    }
});

document.querySelector('.search-input').addEventListener('keyup', (e) => {
    const searchQuery = e.target.value.toLowerCase();
    UI.search(searchQuery);
    e.preventDefault();
});

document.querySelector('.nav-list').addEventListener('click', (e) => {
    const ui = new UI();
    ui.filterCategories(e);
    ui.activeNav(e.target);
});

document.addEventListener('DOMContentLoaded', LocalStore.displayTodo);
document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.querySelector(".theme-toggle");
    const body = document.body;

    if (localStorage.getItem("theme") === "dark") {
        body.classList.add("dark");
        toggleButton.textContent = "☀️"; 
    } else {
        toggleButton.textContent = "🌙"; 
    }

    toggleButton.addEventListener("click", function () {
        body.classList.toggle("dark");

        if (body.classList.contains("dark")) {
            toggleButton.textContent = "☀️"; 
            localStorage.setItem("theme", "dark"); 
        } else {
            toggleButton.textContent = "🌙"; 
            localStorage.setItem("theme", "light");
        }
    });
});

const sidebar = document.querySelector('.sidebar');
const overlay = document.querySelector('.sidebar-overlay');
const toggleButton = document.querySelector('.sidebar-toggle');

toggleButton.addEventListener('click', () => {
    sidebar.classList.add('show');
    overlay.classList.add('show');
    toggleButton.classList.add('hidden');
});

overlay.addEventListener('click', () => {
    sidebar.classList.remove('show');
    overlay.classList.remove('show');
    toggleButton.classList.remove('hidden');
});

const menuItems = document.querySelectorAll('.nav-item');
menuItems.forEach((menuItem) => {
    menuItem.addEventListener('click', () => {
        sidebar.classList.remove('show');
        overlay.classList.remove('show');
        toggleButton.classList.remove('hidden');
    });
});


