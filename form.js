document.addEventListener('DOMContentLoaded', () => {
    const countries = ["Россия", "Беларусь", "США", "Китай", "Германия", "Франция"]; // Создаем массив с названиями стран
    const countrySelect = document.getElementById('country'); //находим элементы по id
    const companySelect = document.getElementById('company-select');
    const form = document.getElementById('company-form');
    const addPropertyButton = document.getElementById('add-property');
    const additionalProperties = document.getElementById('additional-properties');
    const dataTable = document.getElementById('data-table');
    const dataTableBody = dataTable.querySelector('tbody'); //Найди первый элемент <tbody> внутри элемента, хранящегося в dataTable (определен выше)
    let propertyCount = 0; // Переменная для отслеживания количества дополнительных свойств
    let db; // БАЗА ДАННЫХ Переменная для хранения объекта базы данных



    // Заполнение списка стран
    countries.forEach(country => {
        const option = document.createElement('option'); //для каждого значения в массиве создает option
        option.value = country; //присваиваем значение массива к option
        option.textContent = country; //<option value="Россия">Россия</option> адаёт текстовое содержимое внутри элемента
        countrySelect.appendChild(option); //добавляем к  <select id="company-select"> опцию
    });


    // Настройка IndexedDB БАЗА ДАННЫХ
    const request = indexedDB.open('CompanyDatabase', 1); // Открываем базу данных под названием 'CompanyDatabase' с версией 1
    request.onupgradeneeded = (event) => { // Если база данных нуждается в обновлении или создании
        db = event.target.result;  // Получаем объект базы данных
        const objectStore = db.createObjectStore('companies', { keyPath: 'id', autoIncrement: true }); //Создаем объект хранилища под названием 'companies' с ключом 'id'
        //Создаем индексы для поиска по различным полям
        //1 параметр - имя индекса, 2 - путь к полю данных, по которому бедт построен индекс
        objectStore.createIndex('name', 'name', { unique: false }); //unique: false - индекс не должен быть уникальным, то есть может быть несколько полей с индексом name
        objectStore.createIndex('country', 'country', { unique: false });
        objectStore.createIndex('email', 'email', { unique: false });
        objectStore.createIndex('quantity', 'quantity', { unique: false });
        objectStore.createIndex('properties', 'properties', { unique: false });
    };
// Если база данных успешно открыта
    request.onsuccess = (event) => {
        db = event.target.result; //Сохраняем объект базы данных
        updateCompanySelect(); //Обновляем выпадающий список компаний
    };
// Если произошла ошибка при открытии базы данных
    request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.errorCode); // Выводим сообщение об ошибке в консоль
    };



    // Добавление дополнительных свойств (телефон и комментарий)
    addPropertyButton.addEventListener('click', () => {
        propertyCount++; // Увеличиваем счетчик дополнительных свойств
        const propertyDiv = document.createElement('div'); // Создаем новый элемент div для дополнительных свойств
        propertyDiv.className = 'additional-property';
       //id="phone-number-1" если propertyCount = 1 и тд.
        propertyDiv.innerHTML = `
            <label for="phone-number-${propertyCount}">Номер телефона:</label> 
            <input type="tel" id="phone-number-${propertyCount}" name="phone-number-${propertyCount}">

            <label for="comment-${propertyCount}">Комментарий:</label>
            <input type="text" id="comment-${propertyCount}" name="comment-${propertyCount}">
        `;
        additionalProperties.appendChild(propertyDiv); // Добавляем созданный div в контейнер дополнительных свойств
    });



    // Обработка отправки формы
    form.addEventListener('submit', (event) => {
        event.preventDefault(); //отправка формы без перезагрузки страницы
        // Получаем значения полей формы
        const companyName = document.getElementById('company-name').value;
        const country = document.getElementById('country').value;
        const email = document.getElementById('email').value;
        const quantity = document.getElementById('quantity').value;
        // Создаем массив для хранения дополнительных свойств
        const properties = [];
        document.querySelectorAll('.additional-property').forEach(property => {
            const phoneNumber = property.querySelector('input[type="tel"]').value;
            const comment = property.querySelector('input[type="text"]').value;
            properties.push({ phoneNumber, comment });
        });
        // Создаем объект нового элемента
        const newEntry = {
            name: companyName,
            country, // равно country = country, выше явно присваивается из-за разных названий
            email,
            quantity,
            properties
        };
            //БАЗА ДАННЫХ
        const transaction = db.transaction(['companies'], 'readwrite'); // Начинаем транзакцию для записи данных
        const objectStore = transaction.objectStore('companies'); // Получаем объект хранилища
        const request = objectStore.add(newEntry); // Добавляем новый элемент в объект хранилища

        // Если элемент успешно добавлен
        request.onsuccess = () => {
            alert('Компания сохранена в базе данных!');
            form.reset(); // Сбрасываем форму
            additionalProperties.innerHTML = ''; // Очищаем дополнительные свойства
            updateCompanySelect(); // Обновляем выпадающий список компаний
        };

        // Если произошла ошибка при добавлении элемента
        request.onerror = (event) => {
            console.error('Error saving company:', event.target.errorCode); // Выводим сообщение об ошибке в консоль
        };
    });



    //КНОПКА "ДОБАВИТЬ НОВУЮ ЗАПИСЬ" Прокручиваем страницу к форме 
    document.getElementById('add-new').addEventListener('click', () => {
        document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
    });


    //КНОПКА "ОЧИСТИТЬ ФОРМУ КОМПАНИИ"
    document.getElementById('clear-form').addEventListener('click', () => {
        const companyName = companySelect.value; //Получаем выбранную компанию
        if (companyName) {
            const transaction = db.transaction(['companies'], 'readwrite');
            const objectStore = transaction.objectStore('companies');
            const index = objectStore.index('name'); // Создаем индекс для поиска по названию компании
            const request = index.getAll(companyName); // Получаем все элементы с выбранным названием компании

            request.onsuccess = (event) => { // Если элементы успешно получены
                const companies = event.target.result;
                companies.forEach(company => { // Удаляем каждый элемент с выбранным названием компании
                    const deleteRequest = objectStore.delete(company.id);
                    deleteRequest.onsuccess = () => {
                        updateCompanySelect();
                    };
                });
            };
        } else {
            alert('Пожалуйста, выберите компанию.');
        }
    });



    //КНОПКА 'УДАЛИТЬ ВСЕ ЗАПИСИ'
    document.getElementById('delete-all').addEventListener('click', () => {
        const transaction = db.transaction(['companies'], 'readwrite');
        const objectStore = transaction.objectStore('companies');
        const request = objectStore.clear();

        request.onsuccess = () => {
            alert('Все записи удалены!');
            updateCompanySelect();
        };

        request.onerror = (event) => {
            console.error('Error deleting all records:', event.target.errorCode);
        };
    });


    //КНОПКА "ВЫВЕСТИ ВСЕ ЗАПИСИ"
    document.getElementById('show-all').addEventListener('click', () => {
        dataTable.style.display = 'table'; // Делаем таблицу видимой
        displayData(); // Отображаем все данные в таблице
    });


    //КНОПКА "ВЫВЕСТИ ДАННЫЕ КОМПАНИИ"
    document.getElementById('show-company').addEventListener('click', () => {
        const companyName = companySelect.value;
        if (companyName) {
            const transaction = db.transaction(['companies'], 'readonly'); // Начинаем транзакцию для чтения данных
            const objectStore = transaction.objectStore('companies'); // Получаем объект хранилища
            const index = objectStore.index('name'); // Создаем индекс для поиска по названию компании
            const request = index.getAll(companyName); // Получаем все элементы с выбранным названием компании

            request.onsuccess = (event) => {
                const companies = event.target.result;
                displayCompanyData(companies); // Вызываем функцию для отображения данных компании в таблице
            };
        } else {
            alert('Пожалуйста, выберите компанию.');
        }
    });


    //ФУНКЦИИ

    // Обновление выпадающего списка компаний
    function updateCompanySelect() {
        companySelect.innerHTML = '<option value="">Выберите компанию</option>';
        const transaction = db.transaction(['companies'], 'readonly'); // Начинаем транзакцию для чтения данных из базы данных
        const objectStore = transaction.objectStore('companies'); // Получаем объект хранилища, содержащий данные о компаниях
        const request = objectStore.openCursor(); // Открываем курсор для перебора всех записей в хранилище

        request.onsuccess = (event) => { // Если курсор успешно открыт
            const cursor = event.target.result;
            if (cursor) { // Если есть данные для перебор
                const option = document.createElement('option'); // Создаем новый элемент option для выпадающего списка
                option.value = cursor.value.name; // Устанавливаем значение option
                option.textContent = cursor.value.name; // Устанавливаем текст внутри option
                companySelect.appendChild(option); // Добавляем option в выпадающий список компаний
                cursor.continue(); // Продолжаем перебор записей
            }
        };

        request.onerror = (event) => {
            console.error('Error updating company select:', event.target.errorCode);
        };
    }

    // Отображение всех данных в таблице
    function displayData() {
        dataTableBody.innerHTML = ''; // Очистка таблицы перед обновлением

        const transaction = db.transaction(['companies'], 'readonly');
        const objectStore = transaction.objectStore('companies');
        const request = objectStore.openCursor();

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const row = document.createElement('tr'); //Создаем строку в таблице
                row.innerHTML = `
                    <td>${cursor.value.name}</td>
                    <td>${cursor.value.country}</td>
                    <td>${cursor.value.email}</td>
                    <td>${cursor.value.quantity}</td>
                    <td>${cursor.value.properties.map(p => p.phoneNumber).join('<br>')}</td> 
                    <td>${cursor.value.properties.map(p => p.comment).join('<br>')}</td>
                `;
                //.join('<br>') объединяет все номера телефонов в одну строку, разделяя их тегами <br>, чтобы каждый номер телефона отображался на новой строке.
                dataTableBody.appendChild(row);
                cursor.continue();
            }
        };

        request.onerror = (event) => {
            console.error('Error displaying data:', event.target.errorCode);
        };
    }


// Отображение данных выбранной компании в виде таблицы
function displayCompanyData(companies) {
    dataTableBody.innerHTML = ''; // Очистка таблицы перед обновлением

    companies.forEach(company => {
        const row = document.createElement('tr'); // Создаем строку в таблице
        row.innerHTML = `
            <td>${company.name}</td>
            <td>${company.country}</td>
            <td>${company.email}</td>
            <td>${company.quantity}</td>
            <td>${company.properties.map(p => p.phoneNumber).join('<br>')}</td>
            <td>${company.properties.map(p => p.comment).join('<br>')}</td>
        `;
        //.join('<br>') объединяет все номера телефонов в одну строку, разделяя их тегами <br>, чтобы каждый номер телефона отображался на новой строке.
        dataTableBody.appendChild(row);
    });
}
    

    
});



/*// Отображение данных выбранной компании в виде таблицы
function displayCompanyData(companies) {
    dataTableBody.innerHTML = ''; // Очистка таблицы перед обновлением
    companies.forEach(company => {
        const row = document.createElement('tr');
        row.innerHTML = `
           
            <td>${company.name}</td>
        </tr>
        <tr>
            
            <td>${company.country}</td>
        </tr>
        <tr>
           
            <td>${company.email}</td>
        </tr>
        <tr>
          
            <td>${company.quantity}</td>
        </tr>
        ${company.properties.map(property => `
            <tr>
               
                <td>${property.phoneNumber}</td>
            </tr>
            <tr>
                
                <td>${property.comment}</td>
            </tr>
        `).join('')}
        `;
        dataTableBody.appendChild(row);
    });
}
*/
