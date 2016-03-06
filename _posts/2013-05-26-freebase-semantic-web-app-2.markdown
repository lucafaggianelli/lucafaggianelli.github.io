---
layout: post
title:  "Freebase: building a Semantic Web app - Part II"
date:   2013-05-30
categories: freebase google semantic-web
---

## Behind the scenes
At this point you should be interested on what’s behind: everything, from domains to types, is based on a schema. A schema describes how data is structured, it states that a type belongs to a domain, it defines the properties a type has, in practice it is what Semantic Web would call Ontology. You’ve already seen the Person schema, a type belonging to the People domain. /people/person has several properties like Place of Birth, Country of Nationality, Profession etc. and every property has an expected type (respectively) /location/location, /location/country, /people/profession: this means that an instance of /people/person should be connected, through the property /people/person/place_of_birth, to a topic of type /location/location (should is mandatory here because a graph do not check for the correctness of the expected type, but don’t worry for the moment!).

Included types
A type may include other types (included types), for example all types (but mediators) include the type /common/topic which is a base type for description, name, url etc. This somehow behave like a inheritance system: the type Politician include the type Person and the inclusion holds for deeper levels.

Mediator types
Some types are marked as mediator, they are used to better describe a property and their lonely existence is useless! For example the property /people/person/education expects a mediator type. How would you describe the education of a person with one and only one Freebase topic? You may use only the institution (i.e. University of Bologna), but it would be an incomplete description! Here it comes the mediator type /education/education, that features institution, field and period of study, etc. You create an instance of it and this is the object of the property /people/person/education! Anyway a topic containing the information {student: Luca Faggianelli, institution: University of Bologna, field: Electronics} is useless alone, so the mediator type doesn’t include the /common/topic type, so it doesn’t have a name, description etc!

 

You can easily browse behind-the-scenes information on dev.freebase.com. Freebase exposes an API and uses the Metaweb Query Language (MQL, a proprietary query language) to access data (in read and write) very easily. Some links you clicked were calls to Freebase API embedding MQL queries. To experiment with MQL, please visit the Query Editor and read the manual.

Freebase also provide a hosted development environment, Acre, where you can build your own app. Although it may be useful to get started, I don’t think it’s good for building a web app.

Extending with semantics
Whatever you are going to create, a recipes web app using Freebase topics instead of classical tags for the ingredients, or a music/movies recommendation system or other exotic stuffs, I would like to give you some advises!

First of all there’s no need to throw away an existing website for replacing it with graph-driven stuffs, you can easily extend it! Also, in my opinion, tools, standards and technologies are not mature enough to found an entire app on semantic web! Furthermore, the majority of web frameworks, libraries and systems relies on relational DBs, thus replacing them with graph stores would be not so trivial! This nice speech is to introduce the hybrid semantic web application, which is based on classical web technologies in parallel with semantic web magic.

Let’s go back to the example of /people/person as user profile, you can keep the important user info on the DB (password, email, etc.), then create an instance of Person on the graph (/people/person/123) and finally make a connection. Take a look at the graph (made with Dracula Graph Library, you can drag nodes!):

[purehtml]<div id=”graph1″></div><script>

var g = new Graph();

g.addEdge(“/people/person#123″, “/m/0f_3j7″, {label: “/people/person/place_of_birth”, directed: true});

g.addEdge(‘/user#456′,”/people/person#123″, {label: ‘isPerson’, directed: true});
var layouter = new Graph.Layout.Spring(g);layouter.layout();
var renderer = new Graph.Renderer.Raphael(‘graph1′, g, 500, 200);
renderer.draw();

</script>[/purehtml]

The connection between the DB and the graph is made with the triple

{ ‘/user#user_table_ID’, ‘isPerson’, ‘/people/person#graph_inst_ID’ }

user_table_ID is the ID of a user in the DB, while graph_inst_ID is the ID of the instance of /people/person.

Useful code
You can use Freebase REST API with any programming language simply issuing a HTTP request. I hadn’t find any really useful library for either Ruby or JS, so I wrote some useful function.

Javasctipt
The only dependence is jQuery for the AJAX call.

var Freebase = {
  api: 'https://www.googleapis.com/freebase/v1',
  key: '?key=' + 'your_key_here',

  // Main image (icon) of a topic
  img: function(mid) {
    return this.api + '/image' + mid + this.key;
  },

  // MQL query with callback on success
  mql: function(query, callback) {
    $.get(this.api + '/mqlread',
        { query: JSON.stringify(query) },
        callback,
        'json');
  }
}
Most of the time I need the entire schema of a Freebase type (try in editor):

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
In your graph you will store topics with their MID (/m/1b123) and type as /music/artist so when you visualize them you must retrieve their real name, the variable unknown accepts both (try in editor):

var unknown = ['/m/0f_3j7', '/music/artist'],
query = [{ "mid": null,
           "name": null,
           "id": null,
           "type": {limit: 1, id: null},
           "topics:mid|=": unknown }];
Freebase.mql(query, function(names){})
When you are going to fill Freebase properties, you need the Freebase suggest to find the MIDs: it is a powerful widget, but some tweaks are still needed. First of all, when you find a topic and then click on it, the suggest fills the input element with the name, but you need the MID, so register a fb-select event and store the MID in the input as jQuery data, then retrieve it when you need it.

var NS = 'your://namespace.com';
jquery_text_input_element.suggest()
      .bind("fb-select", function(e, data) {
        $(this).val(data.name).data({mid: NS+data.mid})
      });
In many case I need to search among topics of a certain type or domain (for place_of_birth, you would like to search for topics of type /location/location). You may also need to reconfigure the filter after creation of the widget: here’s a hack to do that.

function set_suggest_filter(suggest_elem, filters) {
    // filters = {type: '/music/artist'}
    var suggest = suggest_elem.data('suggest'),
      default_filters = {
        type: '',
        domain: ''};
    filters = $.extend(default_filters, filters);

    $.each(filters, function(key, value) {
      if (!value) {
        delete(suggest.options.ac_param[key]);
      } else {
        suggest.options.ac_param[key] = value;
      }
    });
  }
 

Ruby
You can port the above code in any language, for example I use this in a Ruby on Rails app, in the /lib folder.

module Freebase
  require 'rest-client'

  NS = 'http://rdf.freebase.com/ns'
  API_URL = 'https://www.googleapis.com/freebase/v1'
  API_KEY = 'your_key_here'

  RestClient.proxy = ENV['http_proxy']
  MQLClient = RestClient::Resource.new(API_URL)

  def Freebase.mql(q)
    response = MQLClient['/mqlread'].get({params: { query: q.to_json }})

    return false if response.code != 200 # If errors
    return JSON.parse response # Otherwise
  end

  def Freebase.get_type_schema(type)

    _t = type.gsub(NS, '') # Strip the namespace if any

    q = [{  schema: _t,
            type:   "/type/property",
            name:  nil,
            id:    nil,
            expected_type: {
              :'/freebase/type_hints/mediator' =>  nil,
              name: nil,
              id:   nil },
            :"/freebase/property_hints/disambiguator" => nil,
            master_property:  nil,
            reverse_property: nil,
            unique: nil }];

    return Freebase.mql(q)
  end
end
In Ruby on Rails I generally use hooks to combine DB and graph information for a model. 

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
The table shows the SQL table where the Entity models are stored. Name and description are the attributes of the model.

ID	Name	Description
123	Luca’s Bohemian Pilsener	Bitter, Saaz hop
456	My New Car	Red like hell
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

