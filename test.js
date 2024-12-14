document.addEventListener('DOMContentLoaded', () => {
    // Список стран и других переменных остался без изменений
    const countries = ["Россия", "Беларусь", "США", "Китай", "Германия", "Франция"];
    const countrySelect = document.getElementById('country');
    const companySelect = document.getElementById('company-select');
    const form = document.getElementById('company-form');
    const addPropertyButton = document.getElementById('add-property');
    const additionalProperties = document.getElementById('additional-properties');
    const dataTable = document.getElementById('data-table');
    const dataTableBody = dataTable.querySelector('tbody');
    let propertyCount = 0;
    let db;

    // Заполнение списка стран
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countrySelect.appendChild(option);
    });

    // Настройка IndexedDB
    const request = indexedDB.open('CompanyDatabase', 1);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        const objectStore = db.createObjectStore('companies', { keyPath: 'id', autoIncrement: true });
        objectStore.createIndex('name', 'name', { unique: false });
        objectStore.createIndex('country', 'country', { unique: false });
        objectStore.createIndex('email', 'email', { unique: false });
        objectStore.createIndex('quantity', 'quantity', { unique: false });
        objectStore.createIndex('properties', 'properties', { unique: false });
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        updateCompanySelect();
    };

    request.onerror = (event) => {
        console.error('IndexedDB error:', event.target.errorCode);
    };

    // Добавление дополнительных свойств
    addPropertyButton.addEventListener('click', () => {
        propertyCount++;
        const propertyDiv = document.createElement('div');
        propertyDiv.className = 'additional-property';
        propertyDiv.innerHTML = `
            <label for="phone-number-${propertyCount}">Номер телефона:</label>
            <input type="tel" id="phone-number-${propertyCount}" name="phone-number-${propertyCount}">

            <label for="comment-${propertyCount}">Комментарий:</label>
            <input type="text" id="comment-${propertyCount}" name="comment-${propertyCount}">
        `;
        additionalProperties.appendChild(propertyDiv);
    });

    // Обработка отправки формы
    form.addEventListener('submit', (event) => {
        event.preventDefault();

        const companyName = document.getElementById('company-name').value;
        const country = document.getElementById('country').value;
        const email = document.getElementById('email').value;
        const quantity = document.getElementById('quantity').value;
        
        const properties = [];
        document.querySelectorAll('.additional-property').forEach(property => {
            const phoneNumber = property.querySelector('input[type="tel"]').value;
            const comment = property.querySelector('input[type="text"]').value;
            properties.push({ phoneNumber, comment });
        });

        const newEntry = {
            name: companyName,
            country,
            email,
            quantity,
            properties
        };

        const transaction = db.transaction(['companies'], 'readwrite');
        const objectStore = transaction.objectStore('companies');
        const request = objectStore.add(newEntry);

        request.onsuccess = () => {
            alert('Компания сохранена в базе данных!');
            form.reset();
            additionalProperties.innerHTML = '';
            updateCompanySelect();
        };

        request.onerror = (event) => {
            console.error('Error saving company:', event.target.errorCode);
        };
    });

    document.getElementById('add-new').addEventListener('click', () => {
        document.getElementById('form').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('clear-form').addEventListener('click', () => {
        const companyName = companySelect.value;
        if (companyName) {
            const transaction = db.transaction(['companies'], 'readwrite');
            const objectStore = transaction.objectStore('companies');
            const index = objectStore.index('name');
            const request = index.getAll(companyName);

            request.onsuccess = (event) => {
                const companies = event.target.result;
                companies.forEach(company => {
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

    document.getElementById('show-all').addEventListener('click', () => {
        dataTable.style.display = 'table';
        displayData();
    });

    document.getElementById('show-company').addEventListener('click', () => {
        const companyName = companySelect.value;
        if (companyName) {
            const transaction = db.transaction(['companies'], 'readonly');
            const objectStore = transaction.objectStore('companies');
            const index = objectStore.index('name');
            const request = index.getAll(companyName);

            request.onsuccess = (event) => {
                const companies = event.target.result;
                displayCompanyData(companies);
            };
        } else {
            alert('Пожалуйста, выберите компанию.');
        }
    });

    // Добавляем обработчик события для сортировки компаний по количеству продукции
    document.getElementById('sort-quantity').addEventListener('click', () => {
        const transaction = db.transaction(['companies'], 'readonly');
        const objectStore = transaction.objectStore('companies');
        const request = objectStore.getAll();

        request.onsuccess = (event) => {
            const companies = event.target.result;
            companies.sort((a, b) => a.quantity - b.quantity);
            displaySortedData(companies);
        };

        request.onerror = (event) => {
            console.error('Error sorting data:', event.target.errorCode);
        };
    });

    // Обновление выпадающего списка компаний
    function updateCompanySelect() {
        companySelect.innerHTML = '<option value="">Выберите компанию</option>';
        const transaction = db.transaction(['companies'], 'readonly');
        const objectStore = transaction.objectStore('companies');
        const request = objectStore.openCursor();

        request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const option = document.createElement('option');
                option.value = cursor.value.name;
                option.textContent = cursor.value.name;
                companySelect.appendChild(option);
                cursor.continue();
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
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${cursor.value.name}</td>
                    <td>${cursor.value.country}</td>
                    <td>${cursor.value.email}</td>
                    <td>${cursor.value.quantity}</td>
                    <td>${cursor.value.properties.map(p => p.phoneNumber).join('<br>')}</td>
                    <td>${cursor.value.properties.map(p => p.comment).join('<br>')}</td>
                `;
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
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${company.name}</td>
                <td>${company.country}</td>
                <td>${company.email}</td>
                <td>${company.quantity}</td>
                <td>${company.properties.map(p => p.phoneNumber).join('<br>')}</td>
                <td>${company.properties.map(p => p.comment).join('<br>')}</td>
            `;
            dataTableBody.appendChild(row);
        });

    }

});
