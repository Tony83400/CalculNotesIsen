import { AgendaEvent, getAgendaIsen } from "@/constants/api/agendaIsen";
import { useEffect, useState } from "react";
import { FlatList, View,Text } from "react-native";

interface AgendaProps {
    events: AgendaEvent[];
    day: string;
}


export default function Agenda(){
    const [courses,setCourses]= useState<AgendaProps[]>([]);
    const days = ["Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
    const getAgenda = async () => {
                    const rep = await getAgendaIsen();

            const startweek = new Date();
            startweek.setDate(startweek.getDate() - startweek.getDay() + 1); // Lundi de la semaine
            startweek.setHours(0, 0, 0, 0);

            const tempAgenda : AgendaProps[] = [];
            for (let i = 0; i < days.length; i++) { 
                const startDay = new Date(startweek);
                startDay.setDate(startDay.getDate() + i)
                const endDay = new Date(startDay);
                endDay.setHours(23, 59, 59, 999);  
                const filtered = rep.filter(event =>{
                return event.start >= startDay && event.end <= endDay;
            });             
                const newDay : AgendaProps= {
                    day: days[i],
                    events: filtered
            }
            
            tempAgenda.push(newDay);
        }
        setCourses(tempAgenda);
        console.log(tempAgenda);
          };
    useEffect(() => {
            getAgenda();
        }, []);

    return(<View>
        <FlatList
        data={courses}
        keyExtractor={(item) => item.day}
        renderItem={({ item }) => (
            <View>
                <Text>{item.day}</Text>
                {item.events.map((event, index) => (
                    <View key={index} style={{marginLeft:10, marginBottom:5}}>
                        <Text>{event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {event.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} : {event.title} ({event.location})</Text>
                    </View>
                ))}
            </View>
        )}
    />

    </View>
    );
}
