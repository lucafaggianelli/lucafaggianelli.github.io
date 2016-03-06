---
layout: post
title:  "Restart rails server in one shot"
date:   2013-02-22
categories: ruby-on-rails
---

Restarting a rails server started as daemon may be boring after some time, now I show you a fast and easy way to do it

I generally start rails server (WEBrick and Rails 3.2.11) as a daemon rails s -d , when I don’t need debugging.
Restarting it is very boring, as you need to find the process with `ps aux | grep rails` and kill it.
Well this solution will not change your life, but is very useful! You need this two lines of shell script to restart the server:

{% highlight sh %}
kill -9 `cat tmp/pids/server.pid`
rails s -d
{% endhighlight %}

The nice part is the tmp/pids/server.pid file which stores the process id.
Now you can create a function (or two) in your `.bashrc`:

{% highlight sh %}
rails-restart() { 
  rails-stop() 
  rails s -d 
} 
rails-stop() { 
  kill -9 `cat tmp/pids/server.pid` 
}
{% endhighlight %}

and don’t forget to source it with `. ~/.bashrc` after the modification,
now you can call them simply as rails-restart (obviously work only from the rails app folder).

Please share your solutions!
