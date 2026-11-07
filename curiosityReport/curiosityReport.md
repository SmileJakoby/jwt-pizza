**Description of a topic and why you find it interesting**
Automated testing in Unreal Engine. 
Being a game engine, the nature of testing is very different. It is highly object and state-oriented, and testing is usually very functional; I get this input, and expect this output. 
In a video game, tons of stuff has to happen in real-time. Someone running the game at 240fps will have different bugs than someone running the game at 20fps.
Additionally, Unreal Engine offers blueprints: A low code (drag-and-drop) solution to coding. How do you test that? What external programs exist? What internal offerings does Epic Games provide? 

I find this interesting because: It is something I am actively involved in, and have been involved in for over a year. 
And yet, so far, testing has all been manual! It sounds insane when you say that out loud. 

So, before doing any research, what value could automated testing hold on the game? 

It is rare that exact specifications are made beforehand; unit testing will primarily need to be retroactive.
But I think that is okay, and that alone holds enough value. 

Other than a testing suite that requires all tests to pass, what other kinds of automated testing can help? 

I've noticed that when going at a high speed at a low frame rate, it is very easy for objects in the world to clip through others. 
This is a problem that should be fixed regardless, but surely an automated test could be set up, testing each frame-rate limit (20fps, 30fps, etc) to find the exact threshold that it breaks at. 

**What you did to research the topic**

**Current state of the art for the topic**

**Experiments you conducted, including a detail reproduction path**

**What you learned**
