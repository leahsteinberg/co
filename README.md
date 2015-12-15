#+BEGIN_HTML
<a href='http://www.recurse.com' title='Made with love at the Recurse Center'><img src='https://cloud.githubusercontent.com/assets/2883345/11325206/336ea5f4-9150-11e5-9e90-d86ad31993d8.png' height='20px'/></a>
#+END_HTML

#**Co** is a collaborative text editor  <a href='http://www.recurse.com' title='Made with love at the Recurse Center'><img src='https://cloud.githubusercontent.com/assets/2883345/11325206/336ea5f4-9150-11e5-9e90-d86ad31993d8.png' height='20px'/></a>
based on **[WoOT](https://hal.inria.fr/inria-00071240/document)** (Without Operational Transform)

### What is WoOT?

 - [Recurse Center](www.recurse.com) resident Martin Kleppmann talked about ways of dealing with data where you just hold on to EVERYTHING 
 		that has ever happened, so you can always rebuild to the current state.

 - talked about Collaborative Text Editing, mentioned a 
 		**Conflict-free Replicated Data Type** ( CRDT ) used in an algorithm called WoOT

 - WoOt **==** Without Operational Transform

 Operational Transform is what Google Docs uses. You get an operation and you 
 		transform it so that it fits with the state of your document. 

 	Supposedly this is very annoying.







### How does WoOT Work?

 In **WoOT** every character is a little object (a `WChar`) that holds on to:
 		

```elm
type alias WChar = 
				{
				id: WId
                , next: WId
                , prev: WId
                , vis: Int
                , ch: Char
                }
```








 When you add a character, you tell WoOT what you just did `Insert 'b' 4`, and it will spit out a `WChar`.

 Send this `WChar` to all the peers and they will **integrate** it in to the list of `WChars`, (a `WString`) that represents their version of the document.

 Integration is where the **conflict-free** stuff happens. 

 The way that it integrates in keeps in mind: 

 - the person who made it (lower ids have precedence)

 - the prev and next chars' positions

 - when that person made it (only compared to the other characters they have made)


####if you scramble up all the WChars of a document, and give them to a new client, they will for sure integrate them into the correct order!


#####another cool thing:

We never delete a WChar. We simply mark it invisible.

Yeah, this takes up space, but it helps us avoid confusion when different peers are working with different versions of t*he document. The document is *eventually* consistent.


###Peer.js


Because the server doesn't need to do any work, I decided to use a WebRTC library, `Peer.js` to make all (most) of the communication peer-to-peer.

I followed the model of a **"mesh"** network, in this case, where every peer talks to every other peer. The peers join by talking to the server, and the server tells them about all the existing peers.
Then they contact the peers and let them know they've arrived. After that, all communication is broadcasts of updates to WoOT.



#### How I did it: 
front end  -> CodeMirror text editor

client logic -> Elm implementation of Woot algorithm

networking -> peer.js 'mesh' network with minimal server interaction

server -> node express server


