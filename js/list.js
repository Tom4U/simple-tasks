var myApp = {};

myApp.storageName = 'myApp.TaskRepository';

//region Task Konstruktorfunktionen

myApp.Task = function (title, done) {
    this.id = 0;
    this.title = title;
    this.done = done || false;
};

myApp.TaskRepository = function (storageName) {
    var storage = new myApp.Storage(storageName);

    this.getAllTasks = function () {
        return storage.getTasks();
    };

    this.getTaskById = function (id) {
        var tasks = this.getAllTasks();

        for (var key in tasks) {
            var task = tasks[key];

            if (task.id === parseInt(id))
                return task;
        }

        return null;
    };

    this.addTask = function (task) {
        var tasks = this.getAllTasks();
        var lastId = 0;

        for (var i = 0; i < tasks.length; i++) {
            var t = tasks[i];

            if (t.id > lastId)
                lastId = t.id;
        }

        task.id = ++lastId;

        tasks.push(task);
        storage.syncTasks(tasks);
    };

    this.updateTask = function (task) {
        var tasks = this.getAllTasks();
        var newTasks = [];

        for (var key in tasks) {
            var oldTask = tasks[key];

            if (oldTask.id === task.id) {
                newTasks.push(task);
            } else {
                newTasks.push(oldTask);
            }
        }

        storage.syncTasks(newTasks);
    };

    this.deleteTask = function (id) {
        var tasks = this.getAllTasks();
        var newTasks = [];

        if (!tasks)
            return;

        for (var key in tasks) {
            var task = tasks[key];

            if (task.id !== id)
                newTasks.push(task);
        }

        storage.syncTasks(newTasks);
    };
};

myApp.TaskList = function (taskListId) {
    var repository = new myApp.TaskRepository(myApp.storageName);
    var taskListElement = document.getElementById(taskListId);

    this.init = function () {
        console.debug('Starting myApp Task Manager');

        loadTasks();
    };

    this.removeTask = function (id) {
        console.debug('Deleting Task ' + id);

        repository.deleteTask(id);

        loadTasks();
    };

    this.changeTaskState = function (id, done) {
        console.debug('Changing state `done` to ' + done + ' for task ' + id);

        var task = repository.getTaskById(id);

        if (task) {
            task.done = done;
            repository.updateTask(task);
        } else {
            console.error('Task with ID ' + id + ' not found!');
        }
    };

    function loadTasks() {
        var builder = new myApp.Builder();
        var tasks = repository.getAllTasks();

        taskListElement.innerHTML = '';

        for (var i = 0; i < tasks.length; i++) {
            var task = tasks[i];
            var listItem = builder.getNewListItem(task, taskListId);

            taskListElement.appendChild(listItem);
        }
    }
};

myApp.TaskDetails = function (formName) {
    var repository = new myApp.TaskRepository(myApp.storageName);

    this.loadDetails = function() {
        var id = myApp.getUrlParam('id');
        var task = repository.getTaskById(id);

        if (!task)
            document.location.assign('/');

        console.debug('Loading details for task ' + id);


        var form = document.forms[formName];

        form.titel.value = task.title;
        form.erledigt.checked = task.done;
        form.taskId.value = task.id;
    };
};

//endregion

//region Allgemeine Konstruktorfunktionen

myApp.Builder = function () {
    this.getNewListItem = function (task, taskListId) {
        console.debug('Creating new list item for task ' + task.id);

        var li = document.createElement('li');

        li.id = task.id;

        li.appendChild(getNewCheckbox(task.id, task.done));
        li.appendChild(getNewTitleAnchor(task.id, task.title));
        li.appendChild(getNewDeleteSpan(task.id, taskListId));

        return li;
    };

    function getNewCheckbox (id, done) {
        var input = document.createElement('input');

        input.type = 'checkbox';
        input.checked = done || false;
        input.id = 'task-' + id;

        input.addEventListener('click', function () {
            var box = event.target;
            var state = box.checked;
            var boxId = box.id.substr(5);
            var taskList = new myApp.TaskList();

            taskList.changeTaskState(boxId, state);
        });

        return input;
    }

    function getNewTitleAnchor (id, title) {
        var a = document.createElement('a');

        a.className = 'task-title';
        a.href = 'details.html?id=' + id;
        a.innerText = title;

        return a;
    }

    function getNewDeleteSpan (taskId, taskListId) {
        var span = document.createElement('span');

        span.innerHTML = '&times;';
        span.className = 'delete-task';
        span.title = 'Aufgabe löschen';
        span.addEventListener('click', function () {
            var taskList = new myApp.TaskList(taskListId);
            taskList.removeTask(taskId);
        });

        return span;
    }
};

myApp.Storage = function (storageName) {
    this.getTasks = function () {
        var allTasksString = localStorage.getItem(storageName);
        var allTasks;

        if (!allTasksString || allTasksString.length === 0)
            allTasks = [];
        else
            allTasks = JSON.parse(allTasksString);

        return allTasks;
    };

    this.syncTasks = function (tasks) {
        var tasksString = JSON.stringify(tasks);

        localStorage.setItem(storageName, tasksString);
    };
};

//endregion

//region Hilfsfunktionen

myApp.getUrlParam = function (param) {
    var parts = document.location.href.split('?');
    var value = null;

    if (parts.length > 1) {
        var params = parts[1];
        var paramsArray = params.split('&');

        for (var key in paramsArray) {
            var p = paramsArray[key];

            if (p.indexOf(param + '=') > -1) {
                value = p.split('=')[1];
                break;
            }
        }
    }

    return value;
};

//endregion

//region Event Handler

myApp.onFormSubmit = function (formName) {
    event.preventDefault();

    var form = document.forms[formName];
    var title = form.titel.value;
    var done = form.erledigt.checked;
    var id = form.taskId ? form.taskId.value : null;

    console.debug('Submitting task with title `' + title + '` and state `done` ' + done);

    var repository = new myApp.TaskRepository(myApp.storageName);
    var task = new myApp.Task(title, done);

    if (id) {
        task.id = parseInt(id);
        repository.updateTask(task);
    } else {
        repository.addTask(task);
    }

    alert('Die Aufgabe wurde gespeichert');

    document.location.assign('index.html');
};

//endregion