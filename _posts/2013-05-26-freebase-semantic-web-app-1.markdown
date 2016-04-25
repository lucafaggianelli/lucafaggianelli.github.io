---
layout: post
title:  "Freebase: building a Semantic Web app - Part I"
date:   2013-05-26
post-collection: freebaseapp
tags: freebase google semantic-web
---

Freebase is an open, Creative Commons licensed graph database with more than 23 million entities.
It powers the new Google Semantic search. In this post I’ll briefly describe how it works and 
I’ll give you some hints for building your own semantic web app using Freebase power!

# Introduction
{% include img align='right'
    src='freebase-godfather.png' %}

Freebase ([What is Freebase?](http://wiki.freebase.com/wiki/What_is_Freebase%3F))
has been founded by Metaweb, now acquired by Google and it powers Google semantic
search…when you search for a specific thing (movie, actor…) or when ask something
(how tall is the eiffel tower) it appears an info box on the right: these info are from Freebase!

Now let’s look what Freebase knows, well type something in the input below and when
I say something, I mean anything from Eggplant to F12berlinetta!
A list will appear and if you hover an item you will get a short description:

<input class="fb-suggest" />

{% include link
    href="https://www.gstatic.com/freebase/suggest/4_1/suggest.min.css" %}
{% include script
    src="https://www.gstatic.com/freebase/suggest/4_1/suggest.min.js" %}

What you just used is an autocomplete widget
([Freebase suggest](http://wiki.freebase.com/wiki/Freebase_Suggest) is the official name)
to explore the fantastic world of Freebase.

Freebase is organized in types, something similar to classes or categories.
In turn, domains group together several types  belonging to the same macro-category
(i.e. Film domain has the types Actor, Director, etc.), finally there are the entities
or instances of types, which are called topics.

An example? The music domain contains
[these types](http://www.freebase.com/music/). Here some topics of the
[type /music/artist](http://www.freebase.com/music/artist?instances).

> A note about the notation `/music/artist`: it is a short for
> [http://rdf.freebase.com/ns/music/artist](http://rdf.freebase.com/ns/music/artist),
> where `http://rdf.freebase.com/ns`
> is Freebase namespace and the rest is in the form `/<domain>/<type>`.

Topics may have (and generally do) more than one type:
in OWL/RDF an instance has as many classes as it needs,
this gives more freedom in defining entities!
All of you know [George Clooney](http://www.freebase.com/m/014zcr) as an actor,
but this is not an exhaustive description: see [George Clooney’s types](https://www.googleapis.com/freebase/v1/mqlread/?lang=%2Flang%2Fen&query=%5B%7B+%22id%22%3A+%22%2Fm%2F014zcr%22%2C+%22name%22%3A+null%2C+%22type%22%3A+%5B%5D+%7D%5D) (this is a JSON response to an MQL query, I’ll tell you later!).

_&laquo;Yes…cool…but what can I do with it??&raquo;_ &mdash; Someone

The first advantage is in search! You cannot ask Wikipedia for all
Led Zeppelin’s album, but [you can](https://www.googleapis.com/freebase/v1/mqlread/?lang=%2Flang%2Fen&query=%5B%7B+%22id%22%3A+%22%2Fen%2Fled_zeppelin%22%2C+%22name%22%3A+null%2C+%22%2Fmusic%2Fartist%2Falbum%22%3A+%5B%5D+%7D%5D)
with Freebase and, if you need it, you can ask [all the formats](https://www.googleapis.com/freebase/v1/mqlread/?lang=%2Flang%2Fen&query=%5B%7B+%22id%22%3A+%22%2Fen%2Fled_zeppelin%22%2C+%22name%22%3A+null%2C+%22%2Fmusic%2Fartist%2Falbum%22%3A+%5B%7B+%22name%22%3A+null%2C+%22%2Fmusic%2Falbum%2Freleases%22%3A+%5B%7B+%22%2Fmusic%2Frelease%2Fformat%22%3A+%5B%5D+%7D%5D+%7D%5D+%7D%5D)
in which have been released all Led Zeppelin’s albums or you may be interested
in [32 actors born in the 60s with 2 films of each actors](https://www.googleapis.com/freebase/v1/mqlread/?lang=%2Flang%2Fen&query=%5B%7B+%22%2Fpeople%2Fperson%2Fdate_of_birth%22%3A+null%2C+%22%2Fpeople%2Fperson%2Fdate_of_birth%3C%22%3A+%221970%22%2C+%22%2Fpeople%2Fperson%2Fdate_of_birth%3E%3D%22%3A+%221960%22%2C+%22film%22%3A+%5B%7B+%22film%22%3A+null%2C+%22mid%22%3A+null%2C+%22limit%22%3A+2+%7D%5D%2C+%22limit%22%3A+35%2C+%22name%22%3A+null%2C+%22mid%22%3A+null%2C+%22type%22%3A+%22%2Ffilm%2Factor%22+%7D%5D).

You can find a lot of examples, guides and tutorials on Freebase itself,
about these powerful queries, but this post is about using semantic data
in your website, not about creating a smart search engine!
For example what about using the /people/person type for your users profile: look
[how Freebase describes a person](http://dev.freebase.com/people/person).
Then you should use Freebase topics instead of raw text for users info.
For myself, the property `/people/person/places_lived` would have these topics as object:

* [http://rdf.freebase.com/ns/m/09bzvz](http://rdf.freebase.com/ns/m/09bzvz)
* [http://rdf.freebase.com/ns/m/096g3](http://rdf.freebase.com/ns/m/096g3)
* [http://rdf.freebase.com/ns/m/09btk](http://rdf.freebase.com/ns/m/09btk)

This technique can be used on almost everything, obviously you can define
your own property like _Cars owned_ or _Music I like_ and then assign
cars and musical groups.

> Please notice that the way Freebase represents topics `/m/<id>` it’s
> called Machine ID, it’s not the only identifier for a topic,
> but it’s the preferred one for storing Freebase topics on your own graph store.

