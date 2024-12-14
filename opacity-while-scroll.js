//наблюдатель (IntersectionObserver) — это специальный инструмент, который отслеживает видимость элементов на веб-странице.

//Ждем полной загрузки веб-страницы для запуска ф-ции
document.addEventListener('DOMContentLoaded', () => {
    // Находим все элементы с классами 'screensaver', 'form' и 'result-table'
    const sections = document.querySelectorAll('.screensaver, .form, .result-table');

    //создаем параметры для наблюдателя
    const observerOptions = {
        root: null, //указывает область видимости экрана, null - весь экран по умолчанию
        rootMargin: '0px', //задает отступы для области видимости root, если отстпов нет - то весь экран виден
        threshold: 0.5 // задаёт процент видимости элемента, при котором срабатывает наблюдатель.
    };

    const observerCallback = (entries, observer) => {
        entries.forEach(entry => { // Перебираем все элементы, за которыми наблюдает observer
            if (entry.isIntersecting) { // Если элемент наполовину виден (isIntersecting равно true)
                entry.target.classList.remove('hidden');  // Удаляем класс 'hidden', чтобы сделать элемент видимым (в конце index-style.css)
            } else {
                entry.target.classList.add('hidden'); // Если элемент не виден наполовину, добавляем класс 'hidden', чтобы скрыть элемент
            }
        });
    };

    // Создаем наблюдатель с нашей функцией и параметрами
    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Для каждого элемента из 'sections' запускаем наблюдатель
    sections.forEach(section => {
        observer.observe(section);
    });
});

