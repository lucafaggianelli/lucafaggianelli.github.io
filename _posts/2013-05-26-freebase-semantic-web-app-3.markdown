---
layout: post
title:  "Freebase: building a Semantic Web app - Part III"
date:   2013-06-12
post-collection: freebaseapp
tags: freebase google semantic-web
---

Let's get the hands dirty and integrate Freebase into a webapp.

# Extending with semantics
If you got till here you're wondering how to integrate Freebase into your webapp, well being it
a web app for recipes using Freebase topics instead of classical tags for the ingredients,
maybe a music/movies recommendation system or other exotic stuffs, I would like to give you some advises!

First of all there’s no need to throw away an existing website for replacing it with graph-driven stuffs,
you can easily extend it! Also, in my opinion, tools, standards and technologies are not mature enough
to found an entire app on semantic web.
Furthermore, the majority of web frameworks, libraries and systems relies on relational DBs, thus replacing
them with graph stores would be not so trivial!
This nice speech is to introduce the hybrid semantic web application, which is based on classical web
technologies together with semantic web magic.

Let’s go back to the example of `/people/person` as user profile, you can keep the important user info
on the main DB (i.e. password, email, and username on an SQL DB), then create an instance of
_Person_ on the graph (`/people/person/123`) and finally make a connection. Take a look at the graph
(made with Dracula Graph Library, you can drag nodes!):

[purehtml]<div id=”graph1″></div><script>

var g = new Graph();

g.addEdge(“/people/person#123″, “/m/0f_3j7″, {label: “/people/person/place_of_birth”, directed: true});

g.addEdge(‘/user#456′,”/people/person#123″, {label: ‘isPerson’, directed: true});
var layouter = new Graph.Layout.Spring(g);layouter.layout();
var renderer = new Graph.Renderer.Raphael(‘graph1′, g, 500, 200);
renderer.draw();

</script>[/purehtml]

The connection between the DB and the graph is made with the triple

{% highlight java %}
{ "/user#user_table_ID", "isPerson", "/people/person#graph_inst_ID" }
{% endhighlight %}

where `user_table_ID` is the ID of a user in the main DB, while `graph_inst_ID`
is the ID of the instance of `/people/person`.

## Useful code
You can use Freebase REST API with any programming language simply issuing a HTTP request.
I didn’t find useful libraries for either Ruby or JS, so here some tiny library I wrote.

### Javasctipt

> Get [freebase.js on <i class="fa fa-github"></i> GitHub Gist](
https://gist.github.com/lucafaggianelli/fd9130442b8b038c28bd), note that it depends
on jQuery for Ajax.

A frequent operation I do is getting the entire schema of a Freebase type
([try in MQL editor](http://www.freebase.com/queryeditor?lang=%2Flang%2Fen&q=%5B%7B%22schema%22%3A%22%2Fmusic%2Fartist%22%2C%22type%22%3A%22%2Ftype%2Fproperty%22%2C%22name%22%3Anull%2C%22id%22%3Anull%2C%22expected_type%22%3A%7B%22%2Ffreebase%2Ftype_hints%2Fmediator%22%3Anull%2C%22name%22%3Anull%2C%22id%22%3Anull%7D%2C%22%2Ffreebase%2Fproperty_hints%2Fdisambiguator%22%3Anull%2C%22master_property%22%3Anull%2C%22reverse_property%22%3Anull%2C%22unique%22%3Anull%7D%5D)):

{% highlight javascript %}
var type = '/music/artist';
var query = [{  "schema":        type,
                "type":          "/type/property",
                "name":          null,
                "id":            null,
                "expected_type": {
                  "/freebase/type_hints/mediator": null,
                  "name":          null,
                  "id":            null
                },
                "/freebase/property_hints/disambiguator": null,
                "master_property": null,
                "reverse_property": null,
                "unique": null }];
Freebase.mql(query, function(schema) {});
{% endhighlight %}

In your graph you may store topics with their _MID_ (i.e. /m/1b123) and type as `/music/artist`
so to visualize them you should retrieve the real name, the variable unknown accepts both
([try in MQL editor](http://www.freebase.com/queryeditor?lang=%2Flang%2Fen&q=%5B%7B%22mid%22%3Anull%2C%22name%22%3Anull%2C%22id%22%3Anull%2C%22type%22%3A%7B%22limit%22%3A1%2C%22id%22%3Anull%7D%2C%22topics%3Amid%7C%3D%22%3A%5B%22%2Fm%2F0f_3j7%22%2C%22%2Fmusic%2Fartist%22%5D%7D%5D)):

{% highlight javascript %}
var unknown = ['/m/0f_3j7', '/music/artist'],
query = [{ "mid": null,
           "name": null,
           "id": null,
           "type": {limit: 1, id: null},
           "topics:mid|=": unknown }];
Freebase.mql(query, function(names){})
{% endhighlight %}

When you are going to fill Freebase properties, you need _Freebase suggest_ to find the MIDs:
it is a powerful widget, but some tweaks are still needed. First of all, when you find a topic
and then click on it, the suggest fills the input element with the name, but you need the MID,
so register a fb-select event and store the MID in the input as jQuery data, then retrieve it when you need it.

{% highlight javascript %}
var NS = 'your://namespace.com';
$('#suggest').suggest()
      .bind("fb-select", function(e, data) {
        $(this).val(data.name).data({mid: NS+data.mid})
      });
{% endhighlight %}

Many times I need to search among topics of a certain type or domain, for example
to fill the property _place_of_birth_, I want the _suggest_ widget to search for topics
of type `/location/location`, but it is not possible to reconfigure the filter after
creation of the widget: the function Freebase.set_suggest_filter is just for that!

{% highlight javascript %}
Freebase.set_suggest_filter($('#suggest'), {type: '/music/artist'});
{% endhighlight %}

### Ruby
You can port the above code in any language, for example I use this in a Ruby on Rails app, in the /lib folder:

> Get [freebase.rb on <i class="fa fa-github"></i> GitHub Gist](
https://gist.github.com/lucafaggianelli/c08aa09ed4228759f547)

In Ruby on Rails I used this hooks to combine DB and graph information for models:

{% highlight ruby %}
class Entity < ActiveRecord::Base
  attr_accessible :name, :description
  attr_accessor :details

  # When retrieve an Entity, only DB information is fetched, so use
  # a the 'after_find' hook to search info in the graph
  after_find :get_details

  def get_details

    # Note that the Entity is identified on the graph with the same DB ID
    # using 'self.id'. Check below how Entity details are structured
    query = "
      select ?type ?prop ?val ?pname where {
        v:entity.#{self.id} v:hasDetails ?det.
        ?det ?prop ?val.
        ?det a ?type.
        optional { ?prop rdfs:label ?pname . }
        filter(?prop != rdf:type)
      }"

    response = Sparql.query(query)

    if response
      details = {}
      response['rows'].each do |r|
        # Set type
        # /food/beer => {}
        _t = r[0]['value']
        details[_t] = {} if !details[_t]
        _t = details[_t]

        # Add properties
        _p = r[1]['value']
        _v = r[2]
        _t[_p] = {name: r[3]['value'], values: []} if !_t[_p]
        _t[_p][:values] << [_v['type'], _v['value']]
      end
    end

    # Here you have Freebase-related info!
    self.details = details
  end

end
{% endhighlight %}

The table shows the SQL table where the Entity models are stored. Name and description are the attributes of the model.

| ID    | Name	                    | Description
|:------|:--------------------------|:-------------------
|123	|Luca’s Bohemian Pilsener	|Bitter, Saaz hop
|456	|My New Car                 |Red like hell

This example app allows the user to create anything that is modeled in Freebase, for example a beer! Attributes common to every entities (like /common/topics) are stored in the DB while the entity-specific info are on the graph. The v:entityDetails.451cf43 contains detailed info for the v:entity.123 (note that the ID used in graph is the same used in the DB to obtain a bridge between the two!) and the property rdf:type tells us that it is a beer, then we find Freebase properties like /food/beer/beer_style from the /food/beer schema. If you want to add more details (that is, another Freebase type) just add another v:entityDetails.<random_id> to v:entity.123 and you’re done!

[purehtml]<div id=”graph2″></div><script>
var g2= new Graph();
g2.addEdge(“v:entity.123″, “v:entityDetails.451cf43″, {label: “v:hasDetails”, directed: true});
g2.addEdge(‘v:entityDetails.451cf43′,”fb:food/beer”, {label: ‘rdf:type’, directed: true});
g2.addEdge(‘v:entityDetails.451cf43′,”fb:/m/02hv1lh”, {label: ‘fb:food/beer/beer_style’, directed: true});
var layouter = new Graph.Layout.Spring(g2);layouter.layout();
var renderer = new Graph.Renderer.Raphael(‘graph2′, g2, 500, 200);
renderer.draw();
</script>[/purehtml]

Please tell me your opinions and suggestions!

