"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { createMatchAnnouncement } from '@/services/matchAnnouncementService'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'
import { useState, useEffect } from 'react'
import { searchMatches } from '@/services/matchService'
import { cn } from "@/utils/cn"

const FormSchema = z.object({
  globalMatchId: z.string({
    required_error: "Devi selezionare una partita.",
  }),
  title: z.string().min(2, {
    message: "Il titolo deve contenere almeno 2 caratteri.",
  }).max(50, {
    message: "Il titolo non può superare i 50 caratteri."
  }),
  description: z.string().optional(),
})

export function CreateMatchAnnouncementForm({ venueId, onSuccess }) {
  const form = useForm({
    resolver: zodResolver(FormSchema),
  })

  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [matches, setMatches] = useState([])
  const [selectedMatch, setSelectedMatch] = useState(null)

  useEffect(() => {
    if (searchTerm.length > 2) {
      const fetchMatches = async () => {
        try {
          const results = await searchMatches(searchTerm)
          setMatches(results)
        } catch (error) {
          console.error("Errore nella ricerca partite:", error)
          setMatches([])
        }
      }
      fetchMatches()
    } else {
      setMatches([])
    }
  }, [searchTerm])

  async function onSubmit(data) {
    try {
      const announcementData = {
        ...data,
        venue: venueId,
        globalMatch: data.globalMatchId, // Assicurati che l'ID sia passato
      }
      const newAnnouncement = await createMatchAnnouncement(announcementData)
      toast({
        title: "Annuncio Creato!",
        description: "Il tuo annuncio è stato creato con successo.",
      })
      if (onSuccess) {
        onSuccess(newAnnouncement)
      }
    } catch (error) {
      toast({
        title: "Errore",
        description: "C'è stato un errore nella creazione dell'annuncio.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="globalMatchId"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Partita</FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={open}
                      className="w-full justify-between"
                    >
                      {selectedMatch
                        ? selectedMatch.name
                        : "Seleziona una partita..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput 
                      placeholder="Cerca partita (es. Milan...)"
                      onValueChange={setSearchTerm}
                    />
                    <CommandEmpty>Nessuna partita trovata.</CommandEmpty>
                    <CommandGroup>
                      {matches.map((match) => (
                        <CommandItem
                          value={match.name}
                          key={match._id}
                          onSelect={() => {
                            form.setValue("globalMatchId", match._id)
                            form.setValue("title", match.name) // Pre-compila il titolo
                            setSelectedMatch(match)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              field.value === match._id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div>
                            <p>{match.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(match.date).toLocaleDateString('it-IT')} - {match.league.name}
                            </p>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                Cerca la partita che vuoi annunciare.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titolo Annuncio</FormLabel>
              <FormControl>
                <Input placeholder="Es: Super sfida da noi!" {...field} />
              </FormControl>
              <FormDescription>
                Questo sarà il titolo che gli utenti vedranno.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrizione (Opzionale)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Aggiungi dettagli, promozioni speciali, ecc."
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Invoglia i clienti a venire nel tuo locale.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Crea Annuncio</Button>
      </form>
    </Form>
  )
} 