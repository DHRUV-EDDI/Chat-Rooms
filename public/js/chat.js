const socket = io();

// Elements
const FormTag = document.querySelector('#message-form');
const inputTag = FormTag.querySelector('input');
const submitButton = FormTag.querySelector('button')
const sendLocationButton = document.querySelector('#sendLocation')
const messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search,{ ignoreQueryPrefix: true});

//AutoScroll
const autoScroll = () => {
    //new message element
    const newMessage = messages.lastElementChild
    //Height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = messages.offsetHeight + newMessageMargin
    // Visible Height
    const visibleHeight = messages.offsetHeight
    // Height of messages container
    const containerHeight = messages.scrollHeight
    //How far have I scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight

    if((containerHeight - newMessageHeight) <= scrollOffset)
        messages.scrollTop = messages.scrollHeight
}
socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
    room,
    users
 })
 document.querySelector('#sidebar').innerHTML = html
})
socket.on('message',(message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate,{
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('hh:mm a')
    })
    messages.insertAdjacentHTML("beforeend",html)
    autoScroll()
})

socket.on('locationMessage',(message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate,{
        username: message.username,
        url : message.url,
        createdAt : moment(message.createdAt).format('hh:mm a')
    })
    messages.insertAdjacentHTML("beforeend",html)
    autoScroll()
})
FormTag.addEventListener('submit',(e) =>{
    e.preventDefault()
    // disable the submit Button
    submitButton.setAttribute('disabled','disabled')
    // console.log(e);
    const message = e.target.elements.message.value ;
    socket.emit('sendMessage',message,(error) => {
        //enable the submit Button
        submitButton.removeAttribute('disabled')
        inputTag.value = ''
        inputTag.focus()
        if(error)
            return console.log(error);
        console.log('Delivered!');
    });

});

sendLocationButton.addEventListener('click',() => {
    // Here we are using browser API to grab the lattitude and longitude
    // Note: Old browsers won't support geolocation feature
    if(!navigator.geolocation)
        return alert('Browser not supports this feature');
    //disable the button while fetching the geolocation
    sendLocationButton.setAttribute('disabled','disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{
            lattitude: position.coords.latitude,
            longitude: position.coords.longitude
        },() => {
            // enable the Button
            sendLocationButton.removeAttribute('disabled')
            
            console.log('Location shared!')
        })
    })
})

socket.emit('join',{ username, room },(error) => {
    if(error){
        alert(error);
        location.href = '/'
    }
})
