"use client"

import { ICameraVideoTrack, IMicrophoneAudioTrack } from "agora-rtc-sdk-ng"
import { useAppSelector, useAppDispatch, VOICE_OPTIONS } from "@/common"
import { ITextItem } from "@/types"
import { rtcManager, IUserTracks, IRtcUser } from "@/manager"
import { setRoomConnected, addChatItem, setVoiceType } from "@/store/reducers/global"
import MicSection from "./micSection"
import CamSection from "./camSection"
import Avatar from "./avatar"
import styles from "./index.module.scss"
import { useRef, useEffect, useState, Fragment } from "react"
//import { Avatar } from "antd"

let hasInit = false

const TASKS = {
    "1": {
        "task_name": "Sum of Two Numbers",
        "difficulty": "Easy",
        "description": "Write a function `add_numbers(a: int, b: int) -> int` that takes two integers as input and returns their sum.\n\nExample:\n- Input: a = 3, b = 5\n- Output: 8\n\nEnsure the function handles edge cases, such as:\n- Negative numbers (e.g., a = -1, b = 3 -> Output: 2)\n- Large numbers within the integer range.",
        "preferred_solution": "```python\ndef add_numbers(a: int, b: int) -> int:\n    return a + b\n```"
    },
    "2": {
        "task_name": "Find the First Non-Repeating Character",
        "difficulty": "Medium",
        "description": "Write a function `first_non_repeating(s: str) -> str` that takes a string as input and returns the first non-repeating character. If all characters are repeating, return an empty string.\n\nExample:\n- Input: s = 'swiss'\n- Output: 'w'\n\nEdge Cases:\n- Input: s = 'aabbcc'\n- Output: '' (no non-repeating character)\n- Input: s = ''\n- Output: '' (empty string input)",
        "preferred_solution": "```python\ndef first_non_repeating(s: str) -> str:\n    char_count = {}\n    for char in s:\n        char_count[char] = char_count.get(char, 0) + 1\n\n    for char in s:\n        if char_count[char] == 1:\n            return char\n\n    return ''\n```"
    },
    "3": {
        "task_name": "Reverse a String",
        "difficulty": "Easy",
        "description": "Write a function `reverse_string(s: str) -> str` that takes a string as input and returns the string reversed.\n\nExample:\n- Input: s = 'hello'\n- Output: 'olleh'\n\nEdge Cases:\n- Input: s = ''\n- Output: '' (empty string input)\n- Input: s = 'a'\n- Output: 'a' (single character)",
        "preferred_solution": "```python\ndef reverse_string(s: str) -> str:\n    return s[::-1]\n```"
    },
    "4": {
        "task_name": "Check for Palindrome",
        "difficulty": "Easy",
        "description": "Write a function `is_palindrome(s: str) -> bool` that takes a string as input and returns `True` if the string is a palindrome, otherwise `False`. A palindrome is a string that reads the same backward as forward.\n\nExample:\n- Input: s = 'racecar'\n- Output: True\n- Input: s = 'hello'\n- Output: False\n\nEdge Cases:\n- Input: s = ''\n- Output: True (empty string is a palindrome)\n- Input: s = 'Aba'\n- Output: False (case-sensitive check)",
        "preferred_solution": "```python\ndef is_palindrome(s: str) -> bool:\n    return s == s[::-1]\n```"
    },
    "5": {
        "task_name": "Find All Duplicates in an Array",
        "difficulty": "Medium",
        "description": "Write a function `find_duplicates(nums: List[int]) -> List[int]` that takes an array of integers as input and returns a list of all elements that appear more than once.\n\nExample:\n- Input: nums = [4, 3, 2, 7, 8, 2, 3, 1]\n- Output: [2, 3]\n\nEdge Cases:\n- Input: nums = []\n- Output: [] (empty array)\n- Input: nums = [1, 1, 1, 1]\n- Output: [1]",
        "preferred_solution": "```python\nfrom typing import List\n\ndef find_duplicates(nums: List[int]) -> List[int]:\n    seen = set()\n    duplicates = set()\n    for num in nums:\n        if num in seen:\n            duplicates.add(num)\n        else:\n            seen.add(num)\n    return list(duplicates)\n```"
    },
    "6": {
        "task_name": "Longest Substring Without Repeating Characters",
        "difficulty": "Medium",
        "description": "Write a function `length_of_longest_substring(s: str) -> int` that takes a string as input and returns the length of the longest substring without repeating characters.\n\nExample:\n- Input: s = 'abcabcbb'\n- Output: 3 (substring 'abc')\n- Input: s = 'bbbbb'\n- Output: 1 (substring 'b')\n\nEdge Cases:\n- Input: s = ''\n- Output: 0 (empty string)\n- Input: s = ' '\n- Output: 1 (single space character)",
        "preferred_solution": "```python\ndef length_of_longest_substring(s: str) -> int:\n    char_set = set()\n    left = 0\n    max_length = 0\n\n    for right in range(len(s)):\n        while s[right] in char_set:\n            char_set.remove(s[left])\n            left += 1\n        char_set.add(s[right])\n        max_length = max(max_length, right - left + 1)\n\n    return max_length\n```"
    }
}


const Rtc = () => {
  const dispatch = useAppDispatch()
  const options = useAppSelector(state => state.global.options)
  const { userId, channel } = options
  const [videoTrack, setVideoTrack] = useState<ICameraVideoTrack>()
  const [audioTrack, setAudioTrack] = useState<IMicrophoneAudioTrack>()
  const [remoteuser, setRemoteUser] = useState<IRtcUser>()

  useEffect(() => {
    if (!options.channel) {
      return
    }
    if (hasInit) {
      return
    }

    init()

    return () => {
      if (hasInit) {
        destory()
      }
    }
  }, [options.channel])


  const init = async () => {
    console.log("[test] init")
    rtcManager.on("localTracksChanged", onLocalTracksChanged)
    rtcManager.on("textChanged", onTextChanged)
    rtcManager.on("remoteUserChanged", onRemoteUserChanged)
    await rtcManager.createTracks()
    await rtcManager.join({
      channel,
      userId
    })
    await rtcManager.publish()
    dispatch(setRoomConnected(true))
    hasInit = true
  }

  const destory = async () => {
    console.log("[test] destory")
    rtcManager.off("textChanged", onTextChanged)
    rtcManager.off("localTracksChanged", onLocalTracksChanged)
    rtcManager.off("remoteUserChanged", onRemoteUserChanged)
    await rtcManager.destroy()
    dispatch(setRoomConnected(false))
    hasInit = false
  }

  const onRemoteUserChanged = (user: IRtcUser) => {
    console.log("[test] onRemoteUserChanged", user)
    setRemoteUser(user)
  }

  const onLocalTracksChanged = (tracks: IUserTracks) => {
    console.log("[test] onLocalTracksChanged", tracks)
    const { videoTrack, audioTrack } = tracks
    if (videoTrack) {
      setVideoTrack(videoTrack)
    }
    if (audioTrack) {
      setAudioTrack(audioTrack)
    }
  }

  const onTextChanged = (text: ITextItem) => {
    const isAgent = Number(text.uid) != Number(userId)
    const isTaskText = text.text.includes("task number")
    console.log(text.text)
    let taskNumber = null
    if (isTaskText) {
        const match = text.text.match(/\d+/); // Regular expression to find numbers
        if (match) {
            taskNumber = match[0]; // Extract the first matched number
        }
    }

    task_description = TASKS[taskNumber]
    console.log('-----')
    console.log(taskNumber)
    console.log(task_description)
    console.log('-----')

    if (isAgent && taskNumber) {
      dispatch(addChatItem({
        userId: text.uid,
        text: task_description,
        type: "agent",
        isFinal: text.isFinal,
        time: text.time
      }))
    }
  }


  return <section className={styles.rtc}>

    {/* you */}
    <div className={styles.you}>
      {/* microphone */}
      <MicSection audioTrack={audioTrack}></MicSection>
      {/* camera */}
      <CamSection videoTrack={videoTrack}></CamSection>
    </div>
  </section>
}


export default Rtc;
