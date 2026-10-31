export const initialChats = [
  {
    id: 1, name: "Design Team", type: "group", avatar: "DT", color: "violet",
    preview: "Mina: The new dashboard looks great ✨", time: "14:32", unread: 3, online: false,
    members: "8 members",
    messages: [
      { id: 1, sender: "Mina", text: "Morning everyone! I pushed the latest dashboard concepts.", time: "14:18", mine: false },
      { id: 2, sender: "You", text: "Just checked them. The new direction feels much cleaner.", time: "14:21", mine: true, read: true },
      { id: 3, sender: "Arman", text: "Agreed. I especially like the spacing in the sidebar.", time: "14:24", mine: false },
      { id: 4, sender: "Mina", text: "The new dashboard looks great ✨", time: "14:32", mine: false }
    ]
  },
  {
    id: 2, name: "Sara Ahmadi", type: "private", avatar: "SA", color: "rose",
    preview: "That works for me, thanks!", time: "13:56", unread: 0, online: true,
    members: "last seen recently",
    messages: [
      { id: 1, sender: "Sara", text: "Hey! Did you get a chance to look at the API notes?", time: "13:48", mine: false },
      { id: 2, sender: "You", text: "Yes, I reviewed them this morning.", time: "13:51", mine: true, read: true },
      { id: 3, sender: "Sara", text: "That works for me, thanks!", time: "13:56", mine: false }
    ]
  },
  {
    id: 3, name: "Backend Study Group", type: "group", avatar: "BS", color: "blue",
    preview: "Reza: Redis streams or Pub/Sub?", time: "12:40", unread: 0, online: false,
    members: "12 members",
    messages: [
      { id: 1, sender: "Nima", text: "For chat delivery, we should keep PostgreSQL as the source of truth.", time: "12:32", mine: false },
      { id: 2, sender: "You", text: "Absolutely. Redis should help with real-time fan-out, not replace persistence.", time: "12:36", mine: true, read: true },
      { id: 3, sender: "Reza", text: "Redis streams or Pub/Sub?", time: "12:40", mine: false }
    ]
  },
  {
    id: 4, name: "Amir Hosseini", type: "private", avatar: "AH", color: "amber",
    preview: "Voice message", time: "Yesterday", unread: 0, online: false,
    members: "last seen 2 hours ago",
    messages: [
      { id: 1, sender: "Amir", text: "I’ll send you the notes later today.", time: "Yesterday", mine: false },
      { id: 2, sender: "You", text: "Perfect, thank you!", time: "Yesterday", mine: true, read: true }
    ]
  },
  {
    id: 5, name: "Vellora Announcements", type: "group", avatar: "VA", color: "green",
    preview: "Welcome to the Vellora workspace.", time: "Mon", unread: 0, online: false,
    members: "245 members",
    messages: [
      { id: 1, sender: "Admin", text: "Welcome to the Vellora workspace. Product updates and important news will appear here.", time: "Mon", mine: false }
    ]
  }
];
