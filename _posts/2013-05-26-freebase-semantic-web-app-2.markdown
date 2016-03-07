---
layout: post
title:  "Freebase: building a Semantic Web app - Part II"
date:   2013-05-30
tags: freebase google semantic-web
---

At this point you should be interested on what’s behind Freebase.

# Behind the scenes
In Freebase everything is based on a schema.
A schema describes how data is structured, it states that a type belongs to a domain, it defines
the properties a type has, in practice it is what Semantic Web would call Ontology.
You’ve already seen the [Person schema](http://www.freebase.com/schema/people/person),
a type belonging to the People domain.
`/people/person` has several properties like _Place of Birth_, _Country of Nationality_, _Profession_
and every property has an expected type (respectively) `/location/location`, `/location/country`, `/people/profession`:
this means that an instance of /people/person should be connected, through the property `/people/person/place_of_birth`,
to a topic of type `/location/location` (_should_ is mandatory here because a graph do not check
for the correctness of the expected type).

## Included types
A type may include other types ([included types](http://wiki.freebase.com/wiki/Included_Type)),
for example all types (but mediator types!) include the `/common/topic` which is a base type for
_description_, _name_, _url_ etc. This somehow behaves like an inheritance system: the type _Politician_
include the type _Person_ and the inclusion holds for deeper levels.

## Mediator types
Some types are marked as [Mediators](http://wiki.freebase.com/wiki/Compound_Value_Type),
they are used to better describe a property and their lonely existence is useless!
For example the property `/people/person/education` expects a mediator type.
How would you describe the education of a person with one and only one Freebase topic?
You may use only the institution (i.e. University of Bologna), but it would be an incomplete description!
Here it comes the mediator type `/education/education`, that features _institution_, _field_, _period of study_, etc.
You create an instance of it and this is the object of the property `/people/person/education`!
Anyway a topic containing the information {student: Luca Faggianelli, institution: University of Bologna, field: Electronics}
is useless alone, so the mediator type doesn’t include the `/common/topic` type, so it doesn’t have a name and a description!

## Tools and docs
You can easily browse behind-the-scenes information on [dev.freebase.com](http://dev.freebase.com).
Freebase exposes an API and uses the _Metaweb Query Language_ ([MQL](http://wiki.freebase.com/wiki/MQL), a proprietary query language)
to access data (in read and write) very easily. Some links you clicked were calls to Freebase API
embedding MQL queries. To experiment with MQL, please visit the [Query Editor](http://www.freebase.com/query/) and
[read the manual](http://mql.freebaseapps.com/index.html).

Freebase provides a hosted development environment, [Acre](http://wiki.freebase.com/wiki/Acre), where you can build your own apps.
Although it may be useful to get started, I don’t think it’s good for building a web app.

