import React,{FC} from 'react'
import Tooltip from './Tooltip'

const LeftAction:FC<{refreshLabel?:string}> = ({refreshLabel}) => {
  console.log("holai:",{refreshLabel})
    const onRefresh=()=>{
        if(window.confirm(`${refreshLabel}`)){
          window.location.reload()
        }
      }
      const language = localStorage.getItem('locale');
      console.log({language})
  return (
    <Tooltip content={refreshLabel}>
    <button onClick={onRefresh} style={{border:'2px solid #b99825',background:'none',borderRadius:'50%' ,height:'45px',width:'45px' ,padding:'5px',marginRight:'5px'}}>
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="#b99825">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M13.7071 1.29289C14.0976 1.68342 14.0976 2.31658 13.7071 2.70711L12.4053 4.00896C17.1877 4.22089 21 8.16524 21 13C21 17.9706 16.9706 22 12 22C7.02944 22 3 17.9706 3 13C3 12.4477 3.44772 12 4 12C4.55228 12 5 12.4477 5 13C5 16.866 8.13401 20 12 20C15.866 20 19 16.866 19 13C19 9.2774 16.0942 6.23349 12.427 6.01281L13.7071 7.29289C14.0976 7.68342 14.0976 8.31658 13.7071 8.70711C13.3166 9.09763 12.6834 9.09763 12.2929 8.70711L9.29289 5.70711C9.10536 5.51957 9 5.26522 9 5C9 4.73478 9.10536 4.48043 9.29289 4.29289L12.2929 1.29289C12.6834 0.902369 13.3166 0.902369 13.7071 1.29289Z" fill="#b99825"></path>
            </g>
        </svg>
    </button>
    </Tooltip>
  )
}

export default LeftAction