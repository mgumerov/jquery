define(["jquery"], function($) {
   var columns = 
    [
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

    function reloadTable(pageIdx) {
        if (typeof pageIdx != "number") throw "Number expected"; //primitives are immutable and that's what we actually want here

        var url = 'data.json?page=' + pageIdx;

        return $.ajax({
          url: url,
          dataType : "json",
          success: function (result, textStatus) {
              result.page = result.page.slice(pageSize*(pageIdx-1), pageSize*pageIdx); //todo proper server-side pagination support

              $('#urldebug').text('URL=' + url);
              $('#myTable tbody').empty();
              pageCnt = Math.ceil(result.total / pageSize);
              result.page.forEach(function(row, i) {
                  var tr = $('<tr/>').appendTo($('#myTable tbody'));
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
        columns.forEach(column => tr.append($("<th/>").text(column.name)));

        setPage(1);
    }

    function setPage(pageNum) {
        if (typeof pageNum != "number") throw "Number expected"; //immutability check because we use async processing here
        reloadTable(pageNum).done(() => { updateNav(pageNum); page = pageNum; }).fail((xhr, text) => alert(text));
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
    var pageSize = 5;

    return {
      init: init
    }
});
