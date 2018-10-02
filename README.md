# Whats is this gem about

Using this gem you can easily build an editor which allowes users on you site to choose Thema categories on your site. 
You can check an example on https://www.elibri.com.pl/thema?editor

## Installation

Add this line to your application's Gemfile:

```ruby
gem 'elibri_thema_editor'
```

Add then add to application.js:

```
//= require elibri_thema_editor
```

And to application.scss:

```
@import "elibri_thema_editor";
```

If you don't use rails, then you need to copy `vendor/assets/stylesheets/elibri_thema_editor.scss` and `vendor/assets/javascripts/elibri_thema_editor.js` into your project.

## Dependencies

This editor depends on jQuery. It was testet with jQuery 2.2.4 only so far.

## Usage

To use  this gem you need to include a simple markup on your website:

```html
<div data-fieldname="thema_example_book[thema_example_book_thema_categories_attributes]" data-persisted="[{id:1, code: "AKT"}]' id='thema-browser'></div>
<script type='text/thema'>[{"id":5,"code":"A","name":"Sztuka","remarks":"","children":[{"id":6,"code":"AB","name":"Sztuka – zagadnienia ogólne","remarks":""...</script>
```

The div with id `thema-browser` mark a place where the editor should be placed. It should also have two `data-*` fields: `data-fieldname`, which is the name of the field which will be send to the browser, and `data-persisted`, which is the current value. For new records is should be `[]`

Let's assume, whe have three models, `Product`, `ThemaCategory` and `ProductThemaCategory` (with fields `product_id` and `thema_category_id`)

In `product.rb` we add:

```ruby
  accepts_nested_attributes_for :product_thema_categories, :allow_destroy => true, :reject_if => :all_blank
```
Then the value of `data-fieldname` is `product[product_thema_categories_attributes]` and for `data-persisted`

```ruby
product_thema_categories.map { |c| { id: c.id, code: c.thema_category.code } }.to_json
```
Please remember add a line to strong params, for example:

```ruby
 product_thema_categories_attributes: [:id, :_destroy, :thema_category_id]
```



The thema categories will be imported from `script` with `type='text/thema'`. I should be json
with the list of categories, where each category is a hash with following keys:

  - `id`: numerical category id from the database
  - `code`: thema code
  - `name`: category name
  - `remarks`: comments to the categories
  - `children`: list of children categories



You can also use a gem [elibri_thema](https://github.com/elibri/elibri_thema) for parsing xml with thema categories.

## License

The gem is available as open source under the terms of the [MIT License](http://opensource.org/licenses/MIT).

