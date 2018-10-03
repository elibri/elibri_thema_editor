$(function() {

  //pokaż wszystkie kategorie najwyższego rzędu
  var show_root_categories = function() {
    $(".thema_categories .active").removeClass("active");
    $(".thema_categories .term-found").removeClass("term-found");
    $(".thema_categories .expanded").removeClass("expanded").addClass("collapsed");
    $(".thema_categories tr").hide();
    $("[data-parent=null]").show();
    colorize();
  }

  var search_for_term = function(term) {

    $("#nothing-found").hide();

    term = term.toLowerCase().trim();

    if (term.length == 0) {
      //pokazuj główne kategorie
      show_root_categories();
    } else {

      $("#thema-browser").data("q", "q:" + term);

      var codes = [];
      //istnieje taki kod
      if ($("#thema-browser").data("code_to_id_mapping")[term.toUpperCase()]) {
        codes.push(term.toUpperCase());
      } else {

        term = term.toLowerCase();

        term = term.slice(0, -1 * Math.round(term.length / 3)); //obetnij go o 1/3
        var all_codes = $("#thema-browser").data("all_codes");
        for (var code in all_codes) {
          if (code.toLowerCase() == term) {
            codes.push(code);
          } else {
            var list = all_codes[code];
            if (list) {
              var category_name = list[list.length-1].toLowerCase();
              if (category_name.indexOf(term) > -1) {
                codes.push(code);
              }
            }
          }
        }
      }
      $(".thema_categories tr").hide();
      $(".thema_categories .active").removeClass("active");
      $(".thema_categories .term-found").removeClass("term-found");

      if (codes.length > 0) {

        $(codes).each(function(idx, code) {
          var elem = $("tr[data-code=" + code + "]");
          elem.addClass("term-found");
          while (true) {
            elem.show().find(".collapsed").removeClass("collapsed").addClass("expanded");
            var pcode = elem.data("parent");
            if (pcode) {
              elem =  $("tr[data-code=" + pcode + "]");
            } else {
              break;
            }
          }
        })
        $(codes).each(function(idx, code) {
          //rób plusy, jeśli nie widać kategorii podrzędnych
           if ($("tr[data-parent=" + code + "]:visible").length == 0) {
             $("tr[data-code=" + code + "] .expanded").removeClass("expanded").addClass("collapsed");
           }
        });
        colorize();
      } else {
        $("#nothing-found").show();
      }
    }
  }

  var expand = function(code) {
    $("tr[data-code=" + code + "] .collapsed").removeClass("collapsed").addClass("expanded");
    $("[data-parent=" + code + "]").show();
    colorize();
  }

  var collapse = function(code) {
    collapse_elem($("tr[data-code=" + code + "]"));
    colorize();
  }

  var collapse_elem = function(elem) {
    elem.find(".expanded").removeClass("expanded").addClass("collapsed");
    var code = elem.data("code");
    $("[data-parent=" + code + "]").each(function(idx, child) {
      collapse_elem($(child).hide());
    });
  }

  var open_category = function(code) {
    var tr = $("[data-code=" + code + "]")
    if ($("[data-parent=" + code + "]:visible").length > 0) {
      collapse(code);
    } else {
      expand(code);
    }
  }

  //otwiera odpowiedni fragment drzewa
  var __open_category = function(code) {

    //chowaj informację o tym, że nic nie znaleziono
    $("#nothing-found").hide();

    //czyść okno wyszukiwania
    $("#thema-browser").data("q", null);

    var elem = $("tr[data-code=" + code + "]");

    //gdyby tego nie było, to kliknięcie na aktywną kategorię nie zmieniałoby niczego,
    //a intuicyjne jest zachowanie, gdy aktywna staje się kategoria wyższego rzędu
    if (elem.hasClass("active")) {
      if (code.length == 1) {  //albo pokażą się wszystkie kategorie głównego rzędu
        show_root_categories();
      } else {
        //akcja jakbyśmy realnie klikneli na poziom wyżej
        open_category(elem.data("parent"));
      }
    } else {
      //chowamy wszystkie rekordy i usuwamy klasę active (która podświetla kategorię)
      $(".thema_categories tr").hide();
      $(".thema_categories .active").removeClass("active");
      $(".thema_categories .term-found").removeClass("term-found");

      $(".thema_categories .expanded").removeClass("expanded").addClass("collapsed");

      //wybrany element zaznaczamy boldem
      elem.addClass("active").find(".collapsed").removeClass("collapsed").addClass("expanded");

      //pokazuj wszystkie nadrzędne z minusem
      while (true) {
        elem.show().find(".collapsed").removeClass("collapsed").addClass("expanded");
        var pcode = elem.data("parent");
        if (pcode) { 
          elem =  $("tr[data-code=" + pcode + "]");
        } else {
          break;
        }
      }
      $("tr[data-parent=" + code + "]").show();
      colorize();
    }
  };

  //szukanie
  $(document).on("keypress", "#thema-search", function(e) {
     if (e.keyCode == 13) {
       e.preventDefault();
       search_for_term($("#thema-search").val(), true);
     }
  });

  //eventy rozwijające w dół/w górę drzewo kategorii
  $(document).on("click", '.thema_categories td div.haschildren', function(e) {
    open_category($(this).parent().parent().data("code"));
  });

  $(document).on("click", ".thema_categories a.search", function(e) {
    e.preventDefault();
    open_category($(this).data("dest"));
  });

  //odznaczenie kategorii
  $(document).on("click", "#choosen-categories a[data-cat]", function(e) {
    e.preventDefault();
    var codes = $("#thema-browser").data("cats");
    var code_to_remove = $(this).data("cat");

    //usuń ten kod z listy
    var idx = codes.indexOf(code_to_remove);
    if (idx > -1) {
      codes.splice(idx, 1);
    }

    $("[data-cat=" + code_to_remove + "]").removeClass("minus-icon").addClass("plus-icon");
    build_choosen_cats_table();
  });

  //wybranie kategorii - kliknięcie na plusik przy kategorii
  $(document).on("click", ".thema_categories a[data-cat]", function(e) {
    e.preventDefault();
    var codes = $("#thema-browser").data("cats");
    var code = $(this).data("cat");

    if (codes.includes(code)) {
     var idx = codes.indexOf(code);
     if (idx > -1) {
       codes.splice(idx, 1);
     } 
     $(this).removeClass("minus-icon").addClass("plus-icon");
    } else {
     codes.push(code);
     $(this).removeClass("plus-icon").addClass("minus-icon");
    }

    build_choosen_cats_table();

  });

  var build_choosen_cats_table = function() {
    var codes = $("#thema-browser").data("cats");
    if (codes.length == 0) {
      $("#choosen-categories").hide();
      $("#no-choosen-categories").show();

    } else {
      var trs = [];
      $(codes).each(function(idx, code) {
        var full_name = $("#thema-browser").data("all_codes")[code].join(" / ");
        var remove_link = "<a data-cat='" +  code + "' href='#' title='usuń kategorię' class='minus-icon'></a>";
        trs.push("<tr><td>" + code + "</td><td>" + full_name + "</td><td>" + remove_link + "</td></tr>");
      });
      $("#no-choosen-categories").hide();
      $("#choosen-categories").html(trs.join("")).show();
    }
  }

  //dodawaj naprzemiennie klasy odd i even - żeby tabelka miała naprzemienne paski
  var colorize = function() {
    $(".thema_categories tr:visible").each(function(idx, e) { 
      var c = idx % 2 == 0 ? "even" : "odd";  
      $(e).removeClass("even").removeClass("odd").addClass(c) 
    });
  }

  var add_category_links = function(text, all_codes) {
    var regex = /\b[A-Z1-6][A-Z0-9\-]*\b/g;
    var found = text.match(regex);

    if (found) {
      $(jQuery.unique(found)).each(function(idx, txt) {
        if (all_codes[txt]) {
          var title = all_codes[txt].join(" / ");
          if (text.indexOf(txt + "*") == -1) {
            text = text.replace(new RegExp(txt, "g"), "<a href='#' class='search tooltip' title='" + title + "' data-dest='" + txt + "'>" + txt + "</a>");
          } else {
            text = text.replace(new RegExp(txt + "\\*", "g"), "<a href='#' class='search tooltip' title='" + title + "' data-dest='" + txt + "'>" + txt + "*</a>");
          }
        }
      })
    }

    var regex = /\b[A-Z1-6][A-Z\-]*\*/g;
    var found = text.match(regex);

    return text;
  }

  //buduje drzewo kategorii na podstawie json-a z kategoriami
  var build_tree = function(html, parent_code, categories, depth, all_codes) {
    $(categories).each(function(idx, category) {
      var display, code_classes, code, remarks, category_name;
      if (parent_code) {
        display = "style='display: none;'"   
      } else {
        display = "";
      }

      if (category.children.length > 0) {

        code_classes = "code level" + depth;
        code =  "<div class='haschildren'><div class='state collapsed'></div><span class='code'>" + category.code + "<span></div>";
        //code = category.code + "&hellip;";
        category_name = "<div class='haschildren'>" + escapeHtml(category.name) + "</div>";
      } else {
        code_classes = "code level" + depth;
        code = "<div class='state'></div><span class='code'>" + category.code + "</span>"
        category_name = escapeHtml(category.name);
      }

      if (category.remarks && (category.remarks.length > 0)) {
        remarks = "<div class='remarks'>" + add_category_links(escapeHtml(category.remarks), all_codes) + "</div>";
      } else {
        remarks = "";
      }

      var operations = "";
      if ($("#thema-browser").data("fieldname")) {
        if (category.code.length > 1) {
          operations = "<td style='width: 20px'><a data-cat='" + category.code + "'href='#' title='wybierz kategorię' class='plus-icon'></a></td>";
        } else {
          operations = "<td style='width: 20px'></td>";
        }
      }
      
      html.push("<tr " + display + " data-parent='" + parent_code + "' data-code='" + category.code + "'>" + 
                 "<td class='" + code_classes + "'>" + code + "</td>" + 
                "<td class='description level" + depth + "'>" + category_name + remarks + "</td>" + operations)
      build_tree(html, category.code, category.children, depth + 1, all_codes);
      html.push("</tr>");
    });
  }

  var collect_all_codes = function(categories, all_codes, names_path, code_to_id_mapping) {

     $(categories).each(function(idx, c) {
       all_codes[c.code] = names_path.concat([c.name]);
       code_to_id_mapping[c.code] = c.id;
       collect_all_codes(c.children, all_codes, names_path.concat([c.name]), code_to_id_mapping);
     });
     return all_codes;
  }

  if ($("#thema-browser").length > 0) {

    $("#thema-browser").data("cats", []);
    if ($("#thema-browser").data("persisted")) {
      $($("#thema-browser").data("persisted")).each(function(idx, c) {
        $("#thema-browser").data("cats").push(c.code);
      });
    }

    var data = JSON.parse($("script[type='text/thema']").text());

    var code_to_id_mapping = {}
    var all_codes = collect_all_codes(data, {}, [], code_to_id_mapping);
    $("#thema-browser").data("all_codes", all_codes);
    $("#thema-browser").data("code_to_id_mapping", code_to_id_mapping);

    $("#thema-browser").prepend('<p id="nothing-found" style="display: none;">Przepraszamy, nie została znaleziona żadna kategoria</p>');
    $("#thema-browser").prepend('<div style="clear: both"></div>');
    $("#thema-browser").prepend('<div style="float: right;"><input autocomplete="off" class="searching" id="thema-search" name="thema-search" style="" type="text"><div>');

    var html = [];

    html.push("<table class='thema_categories'>")

    build_tree(html, null, data, 0, all_codes); 

    html.push("</table>");
    
    if ($("#thema-browser").data("fieldname")) {
      html.push("<div id='choosen-categories-label'>Wybrane kategorie:</div><p style='display: none;' id='no-choosen-categories'>Nie została do tej pory wybrana żadna kategoria</p>");
      html.push("<table id='choosen-categories' style='display: none;'></table>")
    }

    $("#thema-browser").append(html.join(""));

    colorize();
    build_choosen_cats_table();

    $(document).trigger("thema:loaded");
    $("#thema-search").show();

    $("#thema-browser").parents("form").on("submit", function() {
      //trzeba dołożyć odpowiednie inputy
      //najpierw iterujemy po wartościach, który przyszły z serwera. Jeśli któregoś już nie ma aktualnej liście, to dodaj pole _destroy
      var idx = 0;
      var choosen_cats = $("#thema-browser").data("cats");
      var form = $("#thema-browser").parents("form");
      var fieldname = $("#thema-browser").data("fieldname");
      var code_to_id_mapping = $("#thema-browser").data("code_to_id_mapping");

      $($("#thema-browser").data("persisted")).each(function(_, c) {
         var code_id = code_to_id_mapping[c.code];
         form.append("<input type='hidden' name='" + fieldname + "[" + idx + "][id]' value='" + c.id + "'/>");
         form.append("<input type='hidden' name='" + fieldname + "[" + idx + "][thema_category_id]' value='" + code_id + "'/>");
         if (choosen_cats.includes(c.code)) {
           choosen_cats.splice(choosen_cats.indexOf(c.code), 1);
         } else {
           form.append("<input type='hidden' name='" + fieldname + "[" + idx + "][_destroy]' value='true'/>");
         }
         idx = idx + 1;
      });

      $(choosen_cats).each(function(_, code) {
        var code_id = code_to_id_mapping[code];
        form.append("<input type='hidden' name='" + fieldname + "[" + idx + "][thema_category_id]' value='" + code_id + "'/>");
        idx = idx + 1;
      });
    });
  }

});
