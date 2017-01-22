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

        function getname(column) {
          return column.name ? column.name : column;
        }

        function init() {
            var tr = $('#myTable thead tr');
            tr.append('<th>#</th>');
            columns.forEach(column => tr.append($("<th/>").text(getname(column))));

            $.ajax({
              url: 'data.json',
              dataType : "json",                     
              success: function (result, textStatus) { 
                  result.forEach(function(row, i) {   
                      if (i>=10) return;               //todo proper pagination

                      var tr = $('<tr/>').appendTo($('#myTable tbody'));
                      tr.append($("<th scope='row'/>").text(i+1));
                      columns.forEach(column => {
                        var td = $("<td/>").appendTo(tr);
                        var value = row[getname(column)];
                        if (!column.present) {
                          td.text(value);
                        } else {
                          td.append(column.present(value));
                        }
                      });
                  });
              } 
            });
        };

        return {
          init: init
        }
});
