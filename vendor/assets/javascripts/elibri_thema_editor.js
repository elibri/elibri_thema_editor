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

  var log_action = function(params) {
    var log_url = $("#thema-browser").data("logurl");

    if (log_url) {
      $.post(log_url, JSON.stringify(params));
    }
  }

  var search_for_term = function(term) {

    var original_term = term;
    var logged = false;

    $("#nothing-found").hide();
    

    term = term.toLowerCase().trim();

    if (term.length == 0) {
      //pokazuj główne kategorie
      log_action({ action: "empty_search" });
      logged = true;
      show_root_categories();
    } else {

      $("#thema-browser").data("q", "q:" + term);

      var codes = [];
      //istnieje taki kod
      if ($("#thema-browser").data("code_to_id_mapping")[term.toUpperCase()]) {
        codes.push(term.toUpperCase());
        logged = true;
        log_action({ action: "code_entered", code: term.toUpperCase() });
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

      if (!logged) {
        log_action({ action: "search", term: original_term, found: codes.length });
      }

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
    log_action({ action: "expand", code: code });
    $("tr[data-code=" + code + "] .collapsed").removeClass("collapsed").addClass("expanded");
    $("[data-parent=" + code + "]").show();
    colorize();
  }

  var collapse = function(code) {
    log_action({ action: "collapse", code: code });
    collapse_elem($("tr[data-code=" + code + "]"));
    colorize();
    if ($(".thema_categories tr:visible").length == 1) { //po wyszukiwaniu został tylko jeden widoczny rząd, to wracamy do widoku podstawowego
      show_root_categories();
    }
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
    var code = $(this).data("dest");
    log_action({ action: "internal_link", code: code });
    search_for_term(code);
    $("#thema-search").val(code);
  });


  var select_category = function(code) {
    var full_name = $("#thema-browser").data("all_codes")[code].join(" / ");
    var remove_link = "<a data-cat='" +  code + "' href='#' title='usuń kategorię' class='minus-icon'></a>";
    var html = "<li><span class='code'>" + code + "</span><span class='category-name'>" + full_name + "</span><span class='remove-icon'>" + remove_link + "</span></li>";
    $("#no-choosen-categories").hide();
    $("[data-cat=" + code + "]").removeClass("plus-icon").addClass("minus-icon");
    $("#choosen-categories").show().append(html);
    log_action({ action: "select", code: code });
  }

  var get_starred_categories = function() {
    var serialized_categories = localStorage.getItem("starred_thema_categories") || "[]";
    return JSON.parse(serialized_categories);
  }

  var add_starred_category = function(code) {
    var cats = get_starred_categories();
    if (!cats.includes(code)) {
      cats.push(code);
      localStorage.setItem("starred_thema_categories", JSON.stringify(cats))
    }
  }

  var remove_starred_category = function(code) {
    var cats = get_starred_categories();
    var index = cats.indexOf(code);
    if (index > -1) {
      cats.splice(index, 1);
      localStorage.setItem("starred_thema_categories", JSON.stringify(cats))
    }
  }

  $(document).on("click", ".empty-star-icon", function(e) {
    e.preventDefault();
    $(this).removeClass("empty-star-icon").addClass("full-star-icon");
    add_starred_category($(this).data("starcat"));
  });

  $(document).on("click", ".full-star-icon", function(e) {
    e.preventDefault();
    $(this).removeClass("full-star-icon").addClass("empty-star-icon");
    remove_starred_category($(this).data("starcat"));
  });

  var selected_categories_list = function() {
    return $("#choosen-categories span.remove-icon a").map(function(_, e) { return $(e).data("cat"); }).get();
  }

  var unselect_category = function(code) {
    $("#choosen-categories span.remove-icon a[data-cat='" + code + "']").parent().parent().remove();
    if (selected_categories_list().length == 0) {
      $("#choosen-categories").hide();
      $("#no-choosen-categories").show();
    }
    //change minus icon to a plus icon in a category list
    $("[data-cat=" + code + "]").removeClass("minus-icon").addClass("plus-icon");
    log_action({ action: "deselect", code: code });
  }

  //odznaczenie kategorii
  $(document).on("click", "#choosen-categories a[data-cat]", function(e) {
    e.preventDefault();
    var code = $(this).data("cat");
    unselect_category(code);
  });

  //wybranie/odznaczenie kategorii - kliknięcie na plusik/minusik przy kategorii
  $(document).on("click", ".thema_categories a[data-cat]", function(e) {
    e.preventDefault();
    var code = $(this).data("cat");
    if (selected_categories_list().includes(code)) {
      unselect_category(code);
    } else {
      select_category(code);
    } 
  });


  var build_initial_choosen_cats_table = function() {
    var codes = $("#thema-browser").data("persisted") || [];
    if (codes.length == 0) {
      $("#choosen-categories").hide();
      $("#no-choosen-categories").show();
    } else {
      $(codes).each(function(_, code) {
        select_category(code.code);
      });
    }
  }

  //dodawaj naprzemiennie klasy odd i even - żeby tabelka miała naprzemienne paski
  var colorize = function() {
    $(".thema_categories tr:visible").each(function(idx, e) { 
      var c = idx % 2 == 0 ? "even" : "odd";  
      $(e).removeClass("even").removeClass("odd").addClass(c) 
    });
  }

  var add_category_links = function(category_code, text, all_codes) {
    var regex = /\b[A-Z1-6][A-Z0-9\-]*\b/g;

    //long string comes first
    var found = jQuery.unique(text.match(regex) || []).sort(function(a, b) { return a.length < b.length });

    //delete current code from code list, because I don't want to link to myself
    var index = found.indexOf(category_code);
    if (index > -1) {
      found.splice(index, 1);
    }

    if (found.length > 0) {
      $(found).each(function(idx, txt) {
        if (all_codes[txt]) {
          var title = all_codes[txt].join(" / ");
          if (text.indexOf(txt + "*") == -1) {
            //make sure, that replaced text isn't a link or data-dest attribute
            text = text.replace(new RegExp("([^>'])" + txt, "g"), function(found) { 
              var prefix = found.replace(txt, "");
              return prefix + "<a href='#' class='search tooltip' title='" + title + "' data-dest='" + txt + "'>" + txt + "</a>";
            });
          } else {
            text = text.replace(new RegExp("([^>'])" + txt + "\\*", "g"), function(found) { 
              var prefix = found.replace(txt, "");
              return prefix + "<a href='#' class='search tooltip' title='" + title + "' data-dest='" + txt + "'>" + txt + "*</a>";
            });
          }
        }
      })
    }

    return text;
  }

  //buduje drzewo kategorii na podstawie json-a z kategoriami
  var build_tree = function(html, parent_code, categories, depth, all_codes, starred_categories) {

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
        remarks = "<div class='remarks'>" + add_category_links(category.code, escapeHtml(category.remarks), all_codes) + "</div>";
      } else {
        remarks = "";
      }

      var operations = "";

      if (category.code.length > 1) {
        if (starred_categories.includes(category.code)) {
          var class_name = "full-star-icon";
        } else {
          var class_name = "empty-star-icon";

        }
        operations = operations + "<td class='op-icon'><a data-starcat='" + category.code + "'href='#' title='ulubiona kategoria?' class='" + class_name + "'></a></td>";
      } else {
        operations = operations + "<td class='op-icon'></td>";
      }

      if ($("#thema-browser").data("fieldname")) {
        if (category.code.length > 1) {
          operations = operations + "<td class='op-icon'><a data-cat='" + category.code + "'href='#' title='wybierz kategorię' class='plus-icon'></a></td>";
        } else {
          operations = operations + "<td class='op-icon'></td>";
        }
      }
      
      html.push("<tr " + display + " data-parent='" + parent_code + "' data-code='" + category.code + "'>" + 
                 "<td class='" + code_classes + "'>" + code + "</td>" + 
                "<td class='description level" + depth + "'>" + category_name + remarks + "</td>" + operations)
      build_tree(html, category.code, category.children, depth + 1, all_codes, get_starred_categories());
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

      sort_icon = '<a href="#" id="sort-icon" title="sortuj kategorie" class="tooltip"> <svg style="height: 15px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M41 288h238c21.4 0 32.1 25.9 17 41L177 448c-9.4 9.4-24.6 9.4-33.9 0L24 329c-15.1-15.1-4.4-41 17-41zm255-105L177 64c-9.4-9.4-24.6-9.4-33.9 0L24 183c-15.1 15.1-4.4 41 17 41h238c21.4 0 32.1-25.9 17-41z" class=""></path></svg> </a> <a href="#" id="stop-sorting" style="display: none">zakończ sortowanie</a>';
      html.push("<div id='choosen-categories-label'>Wybrane kategorie:" + sort_icon + "</div><p style='display: none;' id='no-choosen-categories'>Nie została do tej pory wybrana żadna kategoria</p>");
      html.push("<ul id='choosen-categories' style='display: none;'></ul>")
    }

    $("#thema-browser").append(html.join(""));

    $("#stop-sorting").on("click", function(e) {
       e.preventDefault();
       $("#sort-icon").show();
       $("#stop-sorting").hide();
       $("#choosen-categories").sortable("destroy");
       $(".minus-icon, .plus-icon").show();
    });

    $("#sort-icon").on("click", function(e) {
      e.preventDefault();
      $("#sort-icon").hide();
      $("#stop-sorting").show();

      $("#choosen-categories").sortable({ placeholder: "highlight", tolerance: 'pointer' });
      $("#choosen-categories").disableSelection();
      $(".minus-icon, .plus-icon").hide();
    });

    colorize();
    build_initial_choosen_cats_table();

    $(document).trigger("thema:loaded");
    $("#thema-search").show();

    $("#thema-browser").parents("form").on("submit", function() {
      //trzeba dołożyć odpowiednie inputy
      //najpierw iterujemy po wartościach, który przyszły z serwera. Jeśli któregoś już nie ma aktualnej liście, to dodaj pole _destroy
      var idx = 0;
      var form = $("#thema-browser").parents("form");
      var fieldname = $("#thema-browser").data("fieldname");
      var code_to_id_mapping = $("#thema-browser").data("code_to_id_mapping");

      var persisted = $("#thema-browser").data("persisted");

      $(selected_categories_list()).each(function(_, choosen_code) {
         var code_id = code_to_id_mapping[choosen_code];
         form.append("<input type='hidden' name='" + fieldname + "[" + idx + "][thema_category_id]' value='" + code_id + "'/>");

         var found = persisted.find(function(elem) { return elem.code == choosen_code })

         if (found) { 
           persisted.splice(persisted.indexOf(found), 1);
           form.append("<input type='hidden' name='" + fieldname + "[" + idx + "][id]' value='" + found.id + "'/>");
         }
         idx = idx + 1;
      });

      //zostały jeszcze kody, które muszę wykasować z bazy
      $(persisted).each(function(_, c) {
        var code_id = code_to_id_mapping[c.code];
 -      form.append("<input type='hidden' name='" + fieldname + "[" + idx + "][id]' value='" + c.id + "'/>");
        form.append("<input type='hidden' name='" + fieldname + "[" + idx + "][thema_category_id]' value='" + code_id + "'/>");
        form.append("<input type='hidden' name='" + fieldname + "[" + idx + "][_destroy]' value='true'/>");
        idx = idx + 1;
      })
    });
  }

});
