define(["jquery"], function($) {
   var columns = 
    [
      "ID",
      "Артикул",
      "Поставщик",
      "Бренд",
      "Название",
      "Единица измерения",
      "Базовая цена",
      "Цена",
      "Страна",
      "Коллекция",
      "Класс нагрузки",
      "Фаска",
      "Эффекты",
      "Размер планки, мм",
      "Планок в упаковке, шт",
      "Вес упаковки",
      "Кратность отгрузки, кв.м",
      "Структура поверхности",
      "Формат панели",
      "Тип соединения",
      "Защита от разбухания",
      "Пропитка кантов по периметру",
      "Антистатическое покрытие",
      "Наличие подложки",
      "Цвет",
      "Площадь планки",
      {name: "Картинка", present: (url) => $("<img/>").attr("src",url) }
    ];

    columns.forEach((column,i,columns) => { if (!column.name) columns[i] = { name: column } });

    function reloadTable(url) {
        if (typeof url != "string") throw "String expected"; //strings are immutable and that's what we actually want here
        return $.ajax({
          url: url,
          dataType : "json",
          success: function (result, textStatus) { 
              $('#urldebug').text('URL=' + url);
              $('#myTable tbody').empty();
              result.forEach(function(row, i) {
                  if (i>=5) return;               //todo proper pagination

                  var tr = $('<tr/>').appendTo($('#myTable tbody'));
                  tr.append($("<th scope='row'/>").text(i+1));
                  columns.forEach(column => {
                    var td = $("<td/>").appendTo(tr);
                    var value = row[column.name];
                    if (!column.present) {
                      td.text(value);
                    } else {
                      td.append(column.present(value));
                    }
                  });
              });
          } 
        });
    }

    function init() {
        var tr = $('#myTable thead tr');
        tr.append('<th>#</th>');
        columns.forEach(column => tr.append($("<th/>").text(column.name)));

        setPage(2);
    }

    function setPage(pageNum) {
        reloadTable('data.json?page='+pageNum).done(() => { updateNav(pageNum); page = pageNum; });
    }

    function updateNav(pageNum) {
        var ul = $('.pagination');
        ul.empty();
        if (pageCnt == 1)
           return;

        //1st
        if (1 != pageNum)
            $('<li class="page-item"/>').append($('<a class="page-link page-direct" href = "#"/>').text(1)).appendTo(ul);

        //prev
        if (1 != pageNum - 1 && pageNum != 1)
            $('<li class="page-item"><a class="page-link page-prev" href = "#">&laquo;</a></li>').appendTo(ul);

        //this
        $('<li class="page-item active"/>').append($('<a class="page-link page-direct" href = "#"/>').text(pageNum)).appendTo(ul);

        //next
        if (pageCnt != pageNum + 1 && pageNum != pageCnt)
            $('<li class="page-item"><a class="page-link page-next" href = "#">&raquo;</a></li>').appendTo(ul);

        //last
        if (pageCnt != pageNum)
            $('<li class="page-item"/>').append($('<a class="page-link page-direct" href = "#"/>').text(pageCnt)).appendTo(ul);

        //Set up handlers here so we can consume module internals instead of global vars/fns
        $('.page-link.page-direct').click(eventObject => setPage(Number(eventObject.target.text)));
        $('.page-link.page-next').click(eventObject => setPage(page + 1));
        $('.page-link.page-prev').click(eventObject => setPage(page - 1));
    }

    var page = 1;
    var pageCnt = 10; 

    return {
      init: init
    }
});
