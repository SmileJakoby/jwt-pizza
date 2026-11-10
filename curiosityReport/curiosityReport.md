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
I watched a youtube video about it (https://www.youtube.com/watch?v=vBsGMv2mUPA)
Asked ChatGPT what options existed out there.

**Current state of the art for the topic**
Currently, there is no in-engine support for mocks and spies! 
I'm baffled to see this; is it really that hard to make a mock/spy? **This is a legitimate project for a future student/myself to take a look at!**
However, the state of the art for testing in Unreal Engine seems to be on par with expectations otherwise; the frontend plugin for testing is very comfortable and familiar to use. You write tests that perform actions, and then make assertions, and pass/fail (or declare invalid/error) based on those assertions. 

Generally, an Unreal Engine project is always built in a where you have a 'level' that is actively open, and you are able to 'play' that level at any time. For my project, clicking 'play' will spawn the player character in and, well, proceed to play! It is super nice that there is almost no need to build/package the project to be able to run it. 
Running a test in the testing suite, so long as it is done with a 'functional test actor' (which must be placed within a level) will behave exactly the same. That means that all of the overhead (which, for my game, is just 1 second) for starting up a game session is included with these functional test actors. 
I personally really appreciate that the functional test actors are tests truly done at runtime, however, since... the game itself is runtime! It helps to give more confidence in the tests. 
That said, I expect that in-industry, a significant amount of unit tests are just done using an external c++ testing suite.

**Experiments you conducted, including a detailed reproduction path**
I had an immediately useful way to learn and use this testing suite: testing every spawn-point in the level of my game. Testing each spawn point manually is feasible, but obnoxious. However, when the game is shipped, it is to be assumed that every respawn point WILL be used at some point by someone. And we need to make sure that none of our sloppily-placed spawn points don't drop the player out of the map or otherwise work in an unintended way. 
So, I used the testing suite to go through every spawn point in a level, place the player there for a split second, check and see if the player is within 100 units of that spawn point (For reference, the player character is 120 units tall; this is a rather small amount of leniency) and then move on to the next spawn point. If all spawn points succeed the test, then the test overall succeeds! If a single one fails, the test immediately fails and reports the spawn point that caused the failure. 

**What you learned**
I was very surprised that the testing suite in Unreal Engine was a plugin that needed to be opted into. I can only guess why that is.
Unsurprisingly, writing tests isn't always too different from writing actual code. 

I foresee the automated testing suite being most useful for testing the integrity of individually placed actors/objects throughout the game. Other than spawn points, the most prevelant one I foresee is enemies; they can be pretty finnicky things to work with, and they will likely be receiving changes right up until release. I want a suite of unit tests for them that will ensure that none of these changes break critical behavior. 

